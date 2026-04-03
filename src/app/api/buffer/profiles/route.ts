import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfiles } from '@/lib/buffer/client'
import { AuthError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const admin = await createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('buffer_access_token')
      .eq('id', user.id)
      .single()

    if (!profile?.buffer_access_token) {
      return NextResponse.json({ error: 'Buffer not connected' }, { status: 400 })
    }

    const profiles = await getProfiles(profile.buffer_access_token)
    return NextResponse.json({ profiles })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
