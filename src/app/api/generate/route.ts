import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { generateContent, checkTokenBudget } from '@/lib/anthropic/generate'
import { AuthError, UsageLimitError, ValidationError } from '@/lib/errors'
import type { Plan } from '@/types/generation'

const RequestSchema = z.object({
  content:        z.string().min(1).max(10_000),
  tone:           z.enum(['professional', 'casual', 'witty', 'educational']),
  audience:       z.enum(['general', 'founders', 'marketers', 'developers']),
  brandVoiceId:   z.string().uuid().optional(),
  templateId:     z.string().uuid().optional(),
  twitterLength:  z.union([z.literal(5), z.literal(7), z.literal(10)]).optional().default(7),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid request')
    }

    const { content, tone, audience, brandVoiceId, templateId, twitterLength } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    // Get user profile for plan and usage data
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_used, generations_reset_at')
      .eq('id', user.id)
      .single()

    if (!profile) throw new AuthError('Profile not found')

    const plan = profile.plan as Plan

    // Free users cannot use Instagram or Brand Voice
    if (plan === 'free' && brandVoiceId) {
      throw new ValidationError('Brand Voice requires Pro plan')
    }

    // Check token budget before hitting rate limits or DB
    checkTokenBudget(content)

    // Rate limit check
    const { success: withinLimit, remaining } = await checkRateLimit(user.id, plan)
    if (!withinLimit) throw new UsageLimitError()

    // Fetch brand voice if provided
    let brandVoiceSummary: string | undefined
    let brandVoiceSamples: string[] | undefined
    if (brandVoiceId) {
      const { data: voice } = await supabase
        .from('brand_voices')
        .select('summary, samples')
        .eq('id', brandVoiceId)
        .eq('user_id', user.id)
        .single()
      if (voice) {
        brandVoiceSummary = voice.summary ?? undefined
        brandVoiceSamples = voice.samples
      }
    }

    // Fetch template addon if provided
    let templateAddon: string | undefined
    if (templateId) {
      const { data: template } = await supabase
        .from('templates')
        .select('system_prompt_addon')
        .eq('id', templateId)
        .single()
      if (template?.system_prompt_addon) {
        templateAddon = template.system_prompt_addon
        // Fire-and-forget use_count increment
        supabase.rpc('increment_template_use_count', { p_template_id: templateId })
      }
    }

    const result = await generateContent({
      content,
      tone,
      audience,
      twitterLength,
      brandVoiceSummary,
      brandVoiceSamples,
      templateAddon,
    })

    // Persist generation and increment usage counter atomically
    const { data: generation } = await supabase
      .from('generations')
      .insert({
        user_id:        user.id,
        content_input:  content,
        result:         result as unknown as Record<string, unknown>,
        tone,
        audience,
        brand_voice_id: brandVoiceId ?? null,
        template_id:    templateId ?? null,
        word_count:     content.trim().split(/\s+/).length,
      })
      .select('id')
      .single()

    await supabase
      .from('profiles')
      .update({ generations_used: profile.generations_used + 1 })
      .eq('id', user.id)

    return NextResponse.json({
      id:     generation?.id ?? '',
      result,
      usage: {
        used:     profile.generations_used + 1,
        limit:    plan === 'agency' ? Infinity : (plan === 'pro' ? 100 : 3),
        resetsAt: profile.generations_reset_at,
        plan,
        remaining,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: 'Daily limit reached', upgrade: true }, { status: 429 })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[generate]', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
