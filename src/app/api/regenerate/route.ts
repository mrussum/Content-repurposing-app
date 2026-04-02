import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { regenerateFormat } from '@/lib/anthropic/generate'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import type { FormatKey } from '@/types/generation'

const RequestSchema = z.object({
  generationId: z.string().uuid(),
  format:       z.enum(['summary', 'twitter', 'linkedin', 'instagram', 'blog', 'newsletter', 'quotes']),
  instruction:  z.string().max(200).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid request')
    }

    const { generationId, format, instruction } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile) throw new AuthError()
    if (profile.plan === 'free') throw new PlanRequiredError('pro', 'Regeneration')

    // Fetch the original generation (RLS ensures ownership)
    const { data: generation } = await supabase
      .from('generations')
      .select('content_input, result')
      .eq('id', generationId)
      .single()

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const result = generation.result as Record<string, unknown>
    const currentOutput = JSON.stringify(result[format] ?? '')

    const newValue = await regenerateFormat(
      format as FormatKey,
      generation.content_input,
      currentOutput,
      instruction
    )

    // Update only the specific format key using Postgres jsonb_set
    await supabase.rpc('update_generation_format', {
      p_generation_id: generationId,
      p_format_key:    format,
      p_new_value:     JSON.stringify(newValue),
    })

    return NextResponse.json({ result: newValue })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 403 })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[regenerate]', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
