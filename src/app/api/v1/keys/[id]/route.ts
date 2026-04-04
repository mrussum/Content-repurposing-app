import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

// DELETE — revoke an API key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan !== 'agency') throw new PlanRequiredError('agency')

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)   // RLS enforced, but be explicit

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Agency plan required', upgrade: true }, { status: 403 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
