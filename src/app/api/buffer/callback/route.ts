import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=buffer_auth_failed`)
  }

  // Exchange code for access token
  const res = await fetch('https://api.bufferapp.com/1/oauth2/token.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.BUFFER_CLIENT_ID!,
      client_secret: process.env.BUFFER_CLIENT_SECRET!,
      redirect_uri:  `${appUrl}/api/buffer/callback`,
      code,
      grant_type:    'authorization_code',
    }).toString(),
  })

  if (!res.ok) {
    return NextResponse.redirect(`${appUrl}/settings?error=buffer_token_failed`)
  }

  const { access_token } = await res.json() as { access_token: string }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/login`)

  await supabase
    .from('profiles')
    .update({ buffer_access_token: access_token })
    .eq('id', user.id)

  return NextResponse.redirect(`${appUrl}/settings?buffer=connected`)
}
