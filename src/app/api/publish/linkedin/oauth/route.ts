import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

// LinkedIn OAuth 2.0 — initiates the authorization flow
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const clientId    = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/publish/linkedin/callback`

    if (!clientId) {
      return NextResponse.json({ error: 'LinkedIn integration not configured' }, { status: 503 })
    }

    const state = crypto.randomUUID()

    const response = NextResponse.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid profile w_member_social')}` +
      `&state=${state}`
    )

    response.cookies.set('linkedin_oauth_state', state, {
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
