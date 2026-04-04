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
    return NextResponse.redirect(`${appUrl}/settings?notion_error=access_denied`)
  }

  const storedState = req.cookies.get('notion_oauth_state')?.value
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?notion_error=invalid_state`)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${appUrl}/login`)

    const clientId     = process.env.NOTION_CLIENT_ID!
    const clientSecret = process.env.NOTION_CLIENT_SECRET!
    const redirectUri  = `${appUrl}/api/integrations/notion/callback`

    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type':  'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) throw new Error(`Notion token exchange failed: ${tokenRes.status}`)

    const tokens = await tokenRes.json() as {
      access_token:   string
      workspace_id:   string
    }

    await supabase.from('profiles').update({
      notion_access_token: tokens.access_token,
      notion_workspace_id: tokens.workspace_id,
    }).eq('id', user.id)

    const response = NextResponse.redirect(`${appUrl}/settings?notion_connected=true`)
    response.cookies.delete('notion_oauth_state')
    return response
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.redirect(`${appUrl}/settings?notion_error=token_exchange_failed`)
  }
}
