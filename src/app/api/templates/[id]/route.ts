import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AuthError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

const updateSchema = z.object({
  name:               z.string().min(1).max(80).optional(),
  description:        z.string().max(300).optional(),
  system_prompt_addon:z.string().max(1000).optional(),
  is_public:          z.boolean().optional(),
})

// GET — fetch a single template (increments use_count)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: template } = await supabase
      .from('templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Increment use_count asynchronously — don't await
    const service = createAdminClient()
    service.then(s => s.rpc('increment_template_use_count', { p_template_id: params.id }))

    return NextResponse.json({ template })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// PATCH — update a template (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

    const { data: template, error } = await supabase
      .from('templates')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)   // only owner can update
      .select('id, name, description, is_public, use_count')
      .single()

    if (error || !template) return NextResponse.json({ error: 'Not found or not authorised' }, { status: 404 })

    return NextResponse.json({ template })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// DELETE — remove a template (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
