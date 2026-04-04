import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

const schema = z.object({
  content:      z.string().min(1).max(3000),
  generationId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const service = await createAdminClient()
    const { data: profile } = await service
      .from('profiles')
      .select('plan, linkedin_access_token, linkedin_token_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan === 'free') throw new PlanRequiredError('pro')
    if (!profile.linkedin_access_token) {
      return NextResponse.json({ error: 'LinkedIn not connected', connect: true }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

    const { content, generationId } = parsed.data

    // Check token expiry
    if (profile.linkedin_token_expires_at) {
      const expiresAt = new Date(profile.linkedin_token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'LinkedIn token expired. Please reconnect.', connect: true }, { status: 401 })
      }
    }

    // Get LinkedIn member URN via /v2/userinfo (OpenID Connect)
    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${profile.linkedin_access_token}` },
    })
    if (!meRes.ok) throw new Error(`LinkedIn userinfo failed: ${meRes.status}`)
    const me = await meRes.json() as { sub: string }

    // Post using the UGC Posts API
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${profile.linkedin_access_token}`,
        'Content-Type':  'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author:         `urn:li:person:${me.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })

    if (!postRes.ok) {
      const err = await postRes.json().catch(() => ({}))
      throw new Error(`LinkedIn post failed: ${JSON.stringify(err)}`)
    }

    const postData = await postRes.json() as { id: string }

    if (generationId) {
      await supabase.from('published_posts').insert({
        user_id:       user.id,
        generation_id: generationId,
        platform:      'linkedin',
        content,
        status:        'published',
        published_at:  new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, postId: postData.id })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Pro required', upgrade: true }, { status: 403 })
    if (error instanceof ValidationError)  return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
