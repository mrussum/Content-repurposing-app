import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(req: NextRequest) {
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { searchParams } = req.nextUrl

  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?twitter_error=access_denied`)
  }

  const storedState    = req.cookies.get('twitter_oauth_state')?.value
  const codeVerifier   = req.cookies.get('twitter_oauth_verifier')?.value

  if (!storedState || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(`${appUrl}/settings?twitter_error=invalid_state`)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${appUrl}/login`)

    const clientId     = process.env.TWITTER_CLIENT_ID!
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!
    const redirectUri  = `${appUrl}/api/publish/twitter/callback`

    // Exchange code for access token
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        code,
        grant_type:    'authorization_code',
        redirect_uri:  redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Twitter token exchange failed: ${tokenRes.status}`)
    }

    const tokens = await tokenRes.json() as {
      access_token:  string
      refresh_token: string
      expires_in:    number
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase
      .from('profiles')
      .update({
        twitter_access_token:     tokens.access_token,
        twitter_refresh_token:    tokens.refresh_token,
        twitter_token_expires_at: expiresAt,
      })
      .eq('id', user.id)

    const response = NextResponse.redirect(`${appUrl}/settings?twitter_connected=true`)
    response.cookies.delete('twitter_oauth_state')
    response.cookies.delete('twitter_oauth_verifier')
    return response
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.redirect(`${appUrl}/settings?twitter_error=token_exchange_failed`)
  }
}
