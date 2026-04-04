import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

// Twitter OAuth 2.0 PKCE — initiates the authorization flow
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const clientId     = process.env.TWITTER_CLIENT_ID
    const redirectUri  = `${process.env.NEXT_PUBLIC_APP_URL}/api/publish/twitter/callback`

    if (!clientId) {
      return NextResponse.json({ error: 'Twitter integration not configured' }, { status: 503 })
    }

    // Generate PKCE code verifier + challenge
    const verifier  = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state     = crypto.randomUUID()

    // Store verifier + state in a short-lived cookie (10 min)
    const response = NextResponse.redirect(
      `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('tweet.read tweet.write users.read offline.access')}` +
      `&state=${state}` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256`
    )

    response.cookies.set('twitter_oauth_verifier', verifier, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
    })
    response.cookies.set('twitter_oauth_state', state, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
    })

    return response
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(verifier)
  const digest  = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
