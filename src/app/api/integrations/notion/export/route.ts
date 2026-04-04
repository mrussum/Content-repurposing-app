import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'
import type { BlogSection } from '@/types/generation'

const schema = z.object({
  generationId: z.string().uuid(),
  pageTitle:    z.string().min(1).max(200).optional(),
})

// Export blog outline from a generation to a new Notion page
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message)

    const { generationId, pageTitle } = parsed.data

    // Fetch profile (needs notion token) and generation
    const service = await createAdminClient()
    const { data: profile } = await service
      .from('profiles')
      .select('plan, notion_access_token')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan === 'free') throw new PlanRequiredError('pro')
    if (!profile.notion_access_token) {
      return NextResponse.json({ error: 'Notion not connected', connect: true }, { status: 403 })
    }

    const { data: generation } = await supabase
      .from('generations')
      .select('result, content_input')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (!generation) return NextResponse.json({ error: 'Generation not found' }, { status: 404 })

    const result      = generation.result as { blogOutline?: BlogSection[] }
    const blogOutline = result.blogOutline
    if (!blogOutline || blogOutline.length === 0) {
      return NextResponse.json({ error: 'No blog outline in this generation' }, { status: 400 })
    }

    const title = pageTitle ?? `Blog Outline — ${new Date().toLocaleDateString()}`

    // Build Notion blocks from blog outline
    const blocks = blogOutline.flatMap((section: BlogSection) => [
      {
        object: 'block',
        type:   'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: section.heading } }] },
      },
      ...section.points.map((point: string) => ({
        object: 'block',
        type:   'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: point } }] },
      })),
    ])

    // Create Notion page in user's workspace (no parent page needed — goes to root)
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${profile.notion_access_token}`,
        'Content-Type':  'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent:     { type: 'workspace', workspace: true },
        properties: { title: { title: [{ type: 'text', text: { content: title } }] } },
        children:   blocks,
      }),
    })

    if (!notionRes.ok) {
      const err = await notionRes.json().catch(() => ({}))
      throw new Error(`Notion API error: ${JSON.stringify(err)}`)
    }

    const page = await notionRes.json() as { id: string; url: string }

    return NextResponse.json({ success: true, pageId: page.id, pageUrl: page.url })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Pro required', upgrade: true }, { status: 403 })
    if (error instanceof ValidationError)  return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
