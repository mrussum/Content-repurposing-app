import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthError, PlanRequiredError, ValidationError } from '@/lib/errors'
import * as Sentry from '@sentry/nextjs'

const createSchema = z.object({
  name: z.string().min(1).max(64),
})

// GET — list all API keys for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan !== 'agency') throw new PlanRequiredError('agency')

    const { data: keys } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ keys: keys ?? [] })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Agency plan required', upgrade: true }, { status: 403 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// POST — create a new API key (raw key shown once, only hash stored)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AuthError()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan !== 'agency') throw new PlanRequiredError('agency')

    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message)

    // Enforce a max of 10 keys per user
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 10) {
      throw new ValidationError('Maximum of 10 API keys allowed')
    }

    // Generate a random key with csp_ prefix
    const rawBytes = new Uint8Array(32)
    crypto.getRandomValues(rawBytes)
    const rawKey   = 'csp_' + Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('')
    const prefix   = rawKey.slice(0, 12)

    // SHA-256 hash — only this is stored
    const encoder  = new TextEncoder()
    const digest   = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
    const keyHash  = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, name: parsed.data.name, key_hash: keyHash, key_prefix: prefix })
      .select('id, name, key_prefix, created_at')
      .single()

    if (error) throw error

    // Return raw key once — never retrievable again
    return NextResponse.json({ key: { ...newKey, raw_key: rawKey } }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    if (error instanceof AuthError)        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error instanceof PlanRequiredError)return NextResponse.json({ error: 'Agency plan required', upgrade: true }, { status: 403 })
    if (error instanceof ValidationError)  return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
