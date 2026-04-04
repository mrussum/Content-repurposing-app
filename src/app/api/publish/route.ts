import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPost, createThread } from '@/lib/buffer/client'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import type { Plan } from '@/types/generation'

const RequestSchema = z.object({
  generationId: z.string().uuid(),
  format:       z.enum(['twitter', 'linkedin', 'newsletter']),
  content:      z.string().min(1),
  profileId:    z.string(),
  scheduledAt:  z.string().datetime().optional(),
})

export async function POST(req: Request) {
  try {
    const body   = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid request')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile) throw new AuthError()
    if ((profile.plan as Plan) === 'free') throw new PlanRequiredError('pro', 'Publishing')

    // Fetch Buffer token via admin client (bypasses RLS to read token field)
    const admin = await createAdminClient()
    const { data: fullProfile } = await admin
      .from('profiles')
      .select('buffer_access_token')
      .eq('id', user.id)
      .single()

    if (!fullProfile?.buffer_access_token) {
      return NextResponse.json({ error: 'Buffer not connected. Connect it in Settings.' }, { status: 400 })
    }

    const { format, content, profileId, generationId } = parsed.data
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined

    let bufferPostId: string

    if (format === 'twitter') {
      // content is a JSON-encoded array of tweets
      let tweets: string[]
      try { tweets = JSON.parse(content) } catch { tweets = [content] }
      const ids = await createThread(fullProfile.buffer_access_token, profileId, tweets, scheduledAt)
      bufferPostId = ids[0]
    } else {
      const result = await createPost(fullProfile.buffer_access_token, profileId, content, scheduledAt)
      bufferPostId = result.id
    }

    await supabase.from('published_posts').insert({
      user_id:        user.id,
      generation_id:  generationId,
      platform:       format === 'twitter' ? 'twitter' : format === 'linkedin' ? 'linkedin' : 'newsletter',
      content,
      buffer_post_id: bufferPostId,
      status:         scheduledAt ? 'scheduled' : 'published',
      scheduled_at:   scheduledAt?.toISOString() ?? null,
      published_at:   scheduledAt ? null : new Date().toISOString(),
    })

    return NextResponse.json({ success: true, bufferPostId })
  } catch (error) {
    if (error instanceof AuthError)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError) return NextResponse.json({ error: error.message, upgrade: true }, { status: 403 })
    if (error instanceof ValidationError)   return NextResponse.json({ error: error.message }, { status: 400 })
    console.error('[publish]', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
