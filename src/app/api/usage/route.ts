import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/errors'
import type { Plan } from '@/types/generation'

const PLAN_LIMITS: Record<Plan, number> = {
  free:   3,
  pro:    100,
  agency: Infinity,
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_used, generations_reset_at')
      .eq('id', user.id)
      .single()

    if (!profile) throw new AuthError()

    const plan = profile.plan as Plan

    return NextResponse.json({
      used:     profile.generations_used,
      limit:    PLAN_LIMITS[plan],
      resetsAt: profile.generations_reset_at,
      plan,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
