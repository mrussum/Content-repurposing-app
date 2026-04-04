import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

const createSchema = z.object({
  name:               z.string().min(1).max(80),
  description:        z.string().max(300).default(''),
  system_prompt_addon:z.string().max(1000).default(''),
  is_public:          z.boolean().default(false),
})

// GET — list public templates + user's own private templates
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: templates } = await supabase
      .from('templates')
      .select('id, name, description, is_public, use_count, user_id, created_at')
      .or(`is_public.eq.true,user_id.eq.${user.id}`)
      .order('use_count', { ascending: false })
      .limit(50)

    return NextResponse.json({ templates: templates ?? [] })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// POST — create a custom template (any plan)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message)

    const { data: template, error } = await supabase
      .from('templates')
      .insert({ ...parsed.data, user_id: user.id })
      .select('id, name, description, is_public, use_count, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
