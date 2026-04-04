import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { generateContent, checkTokenBudget } from '@/lib/anthropic/generate'
import { ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

// Public API endpoint for Agency users — authenticated via csp_ prefixed API key
// This endpoint mirrors /api/generate but uses key-based auth instead of session cookies.

const schema = z.object({
  content:       z.string().min(1).max(10_000),
  tone:          z.enum(['professional', 'casual', 'witty', 'educational']).default('professional'),
  audience:      z.enum(['general', 'founders', 'marketers', 'developers']).default('general'),
  twitterLength: z.union([z.literal(5), z.literal(7), z.literal(10)]).default(7),
  brandVoiceId:  z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Extract API key from Authorization header: "Bearer csp_..."
    const authHeader = req.headers.get('authorization') ?? ''
    const rawKey     = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    if (!rawKey.startsWith('csp_')) {
      return NextResponse.json({ error: 'Invalid API key format. Use: Authorization: Bearer csp_...' }, { status: 401 })
    }

    // Hash the provided key and look it up
    const encoder = new TextEncoder()
    const digest  = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
    const keyHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

    const service = await createAdminClient()

    const { data: apiKey } = await service
      .from('api_keys')
      .select('id, user_id')
      .eq('key_hash', keyHash)
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Confirm user is still on agency plan
    const { data: profile } = await service
      .from('profiles')
      .select('plan, generations_used')
      .eq('id', apiKey.user_id)
      .single()

    if (!profile || profile.plan !== 'agency') {
      return NextResponse.json({ error: 'Agency plan required' }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message)

    const { content, tone, audience, twitterLength, brandVoiceId } = parsed.data

    checkTokenBudget(content)

    // Fetch brand voice if provided
    let brandVoiceSummary: string | undefined
    let brandVoiceSamples: string[] | undefined

    if (brandVoiceId) {
      const { data: voice } = await service
        .from('brand_voices')
        .select('summary, samples')
        .eq('id', brandVoiceId)
        .eq('user_id', apiKey.user_id)
        .single()

      if (voice) {
        brandVoiceSummary = voice.summary ?? undefined
        brandVoiceSamples = voice.samples
      }
    }

    const result = await generateContent({
      content,
      tone,
      audience,
      twitterLength,
      brandVoiceSummary,
      brandVoiceSamples,
    })

    // Save generation + update last_used_at + increment counter
    const [{ data: generation }] = await Promise.all([
      service.from('generations').insert({
        user_id:        apiKey.user_id,
        content_input:  content,
        result:         result as unknown as Record<string, unknown>,
        tone,
        audience,
        brand_voice_id: brandVoiceId ?? null,
        word_count:     content.split(/\s+/).length,
      }).select('id').single(),
      service.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id),
      service.from('profiles').update({ generations_used: (profile.generations_used ?? 0) + 1 }).eq('id', apiKey.user_id),
    ])

    return NextResponse.json({ id: generation?.id, result })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
