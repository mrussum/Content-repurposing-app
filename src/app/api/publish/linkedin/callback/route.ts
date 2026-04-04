import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { searchParams } = req.nextUrl

  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=access_denied`)
  }

  const storedState = req.cookies.get('linkedin_oauth_state')?.value
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=invalid_state`)
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${appUrl}/login`)

    const clientId     = process.env.LINKEDIN_CLIENT_ID!
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
    const redirectUri  = `${appUrl}/api/publish/linkedin/callback`

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`LinkedIn token exchange failed: ${tokenRes.status}`)
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      expires_in:   number
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase.from('profiles').update({
      linkedin_access_token:     tokens.access_token,
      linkedin_token_expires_at: expiresAt,
    }).eq('id', user.id)

    const response = NextResponse.redirect(`${appUrl}/settings?linkedin_connected=true`)
    response.cookies.delete('linkedin_oauth_state')
    return response
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=token_exchange_failed`)
  }
}
