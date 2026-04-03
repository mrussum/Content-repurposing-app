import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError } from '@/lib/errors'
import type { GenerationResult, Plan } from '@/types/generation'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id     = searchParams.get('id')
    const format = searchParams.get('format') as 'json' | 'markdown' | 'text' | null

    if (!id || !format || !['json', 'markdown', 'text'].includes(format)) {
      return NextResponse.json({ error: 'Missing id or format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('id', user.id).single()
    if (!profile) throw new AuthError()
    if ((profile.plan as Plan) === 'free') throw new PlanRequiredError('pro', 'Export')

    const { data: generation } = await supabase
      .from('generations')
      .select('result, content_input, tone, audience, created_at')
      .eq('id', id)
      .single()

    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = generation.result as unknown as GenerationResult

    let body: string
    let contentType: string
    let filename: string

    if (format === 'json') {
      body        = JSON.stringify({ id, ...result }, null, 2)
      contentType = 'application/json'
      filename    = `generation-${id.slice(0, 8)}.json`
    } else if (format === 'markdown') {
      body = buildMarkdown(result, generation.content_input, generation.created_at)
      contentType = 'text/markdown'
      filename    = `generation-${id.slice(0, 8)}.md`
    } else {
      body = buildPlainText(result)
      contentType = 'text/plain'
      filename    = `generation-${id.slice(0, 8)}.txt`
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof AuthError)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError) return NextResponse.json({ error: error.message, upgrade: true }, { status: 403 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

function buildMarkdown(result: GenerationResult, input: string, createdAt: string): string {
  const date = new Date(createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })
  return [
    `# Content Generation — ${date}`,
    `\n> **Source content:** ${input.slice(0, 200)}${input.length > 200 ? '…' : ''}`,
    `\n## Summary\n\n${result.summary}`,
    `\n## Twitter Thread\n\n${result.twitter.tweets.map((t) => `- ${t}`).join('\n')}`,
    `\n## LinkedIn Post\n\n${result.linkedin}`,
    `\n## Newsletter\n\n${result.newsletter}`,
    `\n## Key Quotes\n\n${result.quotes.map((q) => `> "${q}"`).join('\n\n')}`,
    `\n## Blog Outline\n\n${result.blogOutline.map((s) =>
      `### ${s.heading}\n\n${s.points.map((p) => `- ${p}`).join('\n')}`
    ).join('\n\n')}`,
    `\n## Instagram Carousel\n\n${result.instagram.map((s) =>
      `**Slide ${s.slide} (${s.type}):** ${s.headline}\n${s.body}`
    ).join('\n\n')}`,
  ].join('\n')
}

function buildPlainText(result: GenerationResult): string {
  return [
    `SUMMARY\n${'─'.repeat(40)}\n${result.summary}`,
    `TWITTER THREAD\n${'─'.repeat(40)}\n${result.twitter.tweets.join('\n\n')}`,
    `LINKEDIN POST\n${'─'.repeat(40)}\n${result.linkedin}`,
    `NEWSLETTER\n${'─'.repeat(40)}\n${result.newsletter}`,
    `KEY QUOTES\n${'─'.repeat(40)}\n${result.quotes.map((q) => `"${q}"`).join('\n\n')}`,
    `BLOG OUTLINE\n${'─'.repeat(40)}\n${result.blogOutline.map((s) =>
      `${s.heading}\n${s.points.map((p) => `  • ${p}`).join('\n')}`
    ).join('\n\n')}`,
    `INSTAGRAM CAROUSEL\n${'─'.repeat(40)}\n${result.instagram.map((s) =>
      `Slide ${s.slide} [${s.type}]\n${s.headline}\n${s.body}`
    ).join('\n\n')}`,
  ].join('\n\n')
}
