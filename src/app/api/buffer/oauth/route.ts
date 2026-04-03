import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const params     = new URLSearchParams({
    client_id:     process.env.BUFFER_CLIENT_ID!,
    redirect_uri:  `${appUrl}/api/buffer/callback`,
    response_type: 'code',
  })

  return NextResponse.redirect(`https://bufferapp.com/oauth2/authorize?${params}`)
}
