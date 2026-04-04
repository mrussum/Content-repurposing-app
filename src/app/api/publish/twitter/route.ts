import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

const schema = z.object({
  tweets:      z.array(z.string().max(280)).min(1).max(25),
  generationId:z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    // Fetch profile using service client so we can read the token
    const service = await createAdminClient()
    const { data: profile } = await service
      .from('profiles')
      .select('plan, twitter_access_token, twitter_refresh_token, twitter_token_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan === 'free') throw new PlanRequiredError('pro')
    if (!profile.twitter_access_token) {
      return NextResponse.json({ error: 'Twitter not connected', connect: true }, { status: 403 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message)

    const { tweets, generationId, scheduledAt } = parsed.data

    let accessToken = profile.twitter_access_token

    // Refresh token if expired
    if (profile.twitter_token_expires_at) {
      const expiresAt = new Date(profile.twitter_token_expires_at)
      if (expiresAt < new Date(Date.now() + 60_000)) {
        accessToken = await refreshTwitterToken(user.id, profile.twitter_refresh_token!, service as Awaited<ReturnType<typeof createAdminClient>>)
      }
    }

    // Post thread — each tweet replies to the previous one
    const postedIds: string[] = []
    for (const tweetText of tweets) {
      const body: Record<string, unknown> = { text: tweetText }
      if (postedIds.length > 0) {
        body.reply = { in_reply_to_tweet_id: postedIds[postedIds.length - 1] }
      }

      const res = await fetch('https://api.twitter.com/2/tweets', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Twitter API error: ${JSON.stringify(err)}`)
      }

      const data = await res.json() as { data: { id: string } }
      postedIds.push(data.data.id)

      // Rate-limit safety: wait 500ms between tweets in a thread
      if (tweets.length > 1) await new Promise(r => setTimeout(r, 500))
    }

    // Record in published_posts
    if (generationId) {
      await supabase.from('published_posts').insert({
        user_id:       user.id,
        generation_id: generationId,
        platform:      'twitter',
        content:       tweets.join('\n\n'),
        status:        scheduledAt ? 'scheduled' : 'published',
        scheduled_at:  scheduledAt ?? null,
        published_at:  scheduledAt ? null : new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, tweetIds: postedIds })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Pro required', upgrade: true }, { status: 403 })
    if (error instanceof ValidationError)  return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

async function refreshTwitterToken(
  userId: string,
  refreshToken: string,
  service: Awaited<ReturnType<typeof createAdminClient>>
): Promise<string> {
  const clientId     = process.env.TWITTER_CLIENT_ID!
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!

  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Twitter token')

  const tokens = await res.json() as {
    access_token:  string
    refresh_token: string
    expires_in:    number
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await service.from('profiles').update({
    twitter_access_token:     tokens.access_token,
    twitter_refresh_token:    tokens.refresh_token,
    twitter_token_expires_at: expiresAt,
  }).eq('id', userId)

  return tokens.access_token
}
