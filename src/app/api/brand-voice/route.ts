import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeBrandVoice } from '@/lib/anthropic/generate'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import { PLAN_FEATURES } from '@/types/billing'
import type { Plan } from '@/types/generation'

const CreateSchema = z.object({
  name:    z.string().min(1).max(50).default('My Brand Voice'),
  samples: z.array(z.string().min(10).max(2000)).min(1).max(5),
})

const UpdateSchema = z.object({
  id:      z.string().uuid(),
  name:    z.string().min(1).max(50).optional(),
  samples: z.array(z.string().min(10).max(2000)).min(1).max(5).optional(),
})

async function getUserAndPlan(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile) throw new AuthError()

  const plan = profile.plan as Plan
  if (plan === 'free') throw new PlanRequiredError('pro', 'Brand Voice')

  return { user, plan }
}

export async function POST(req: Request) {
  try {
    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid request')

    const supabase        = await createClient()
    const { user, plan }  = await getUserAndPlan(supabase)

    // Enforce voice slot limits
    const { count } = await supabase
      .from('brand_voices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const maxSlots = PLAN_FEATURES[plan].brandVoiceSlots
    if ((count ?? 0) >= maxSlots) {
      throw new ValidationError(`Your plan allows ${maxSlots} brand voice${maxSlots > 1 ? 's' : ''}. Delete one to add another.`)
    }

    const summary = await analyzeBrandVoice(parsed.data.samples)

    const { data: voice, error } = await supabase
      .from('brand_voices')
      .insert({ user_id: user.id, name: parsed.data.name, samples: parsed.data.samples, summary })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ voice })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(req: Request) {
  try {
    const body   = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid request')

    const supabase = await createClient()
    await getUserAndPlan(supabase)

    const updates: Record<string, unknown> = {}
    if (parsed.data.name)    updates.name    = parsed.data.name
    if (parsed.data.samples) {
      updates.samples = parsed.data.samples
      updates.summary = await analyzeBrandVoice(parsed.data.samples)
    }

    const { data: voice, error } = await supabase
      .from('brand_voices')
      .update(updates)
      .eq('id', parsed.data.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ voice })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) throw new ValidationError('Missing id')

    const supabase = await createClient()
    await getUserAndPlan(supabase)

    const { error } = await supabase
      .from('brand_voices')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (error instanceof PlanRequiredError) return NextResponse.json({ error: error.message, upgrade: true }, { status: 403 })
  if (error instanceof ValidationError)  return NextResponse.json({ error: error.message }, { status: 400 })
  console.error('[brand-voice]', error)
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
}
