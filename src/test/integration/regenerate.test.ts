import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/regenerate/route'
import { MOCK_GENERATION_RESULT } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/anthropic/generate', () => ({
  regenerateFormat: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { regenerateFormat } from '@/lib/anthropic/generate'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/regenerate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const VALID_GEN_ID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_BODY   = { generationId: VALID_GEN_ID, format: 'linkedin' }

function makeProSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } } }),
    },
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === 'profiles'
          ? { plan: 'pro' }
          : { content_input: 'Original content', result: MOCK_GENERATION_RESULT },
        error: null,
      }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

describe('POST /api/regenerate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as never)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 403 for free-plan users', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
      }),
    } as never)

    const res  = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
    const body = await res.json() as { upgrade: boolean }
    expect(body.upgrade).toBe(true)
  })

  it('returns 400 for invalid format', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)

    const res = await POST(makeRequest({ ...VALID_BODY, format: 'youtube' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-UUID generationId', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)

    const res = await POST(makeRequest({ ...VALID_BODY, generationId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for instruction over 200 chars', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)

    const res = await POST(makeRequest({
      ...VALID_BODY,
      instruction: 'a'.repeat(201),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with regenerated content for pro user', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)
    vi.mocked(regenerateFormat).mockResolvedValue('Regenerated LinkedIn post content.')

    const res  = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json() as { result: string }
    expect(body.result).toBe('Regenerated LinkedIn post content.')
  })

  it('passes the instruction to regenerateFormat', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)
    vi.mocked(regenerateFormat).mockResolvedValue('New content.')

    await POST(makeRequest({ ...VALID_BODY, instruction: 'make it shorter' }))

    expect(regenerateFormat).toHaveBeenCalledWith(
      'linkedin',
      'Original content',
      expect.any(String),
      'make it shorter'
    )
  })

  it('works without an instruction', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProSupabase() as never)
    vi.mocked(regenerateFormat).mockResolvedValue('New content.')

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    expect(regenerateFormat).toHaveBeenCalledWith(
      'linkedin',
      'Original content',
      expect.any(String),
      undefined
    )
  })

  it('calls the jsonb_set RPC after successful regeneration', async () => {
    const supabase = makeProSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(regenerateFormat).mockResolvedValue('Updated content.')

    await POST(makeRequest(VALID_BODY))

    expect(supabase.rpc).toHaveBeenCalledWith(
      'update_generation_format',
      expect.objectContaining({
        p_generation_id: VALID_GEN_ID,
        p_format_key:    'linkedin',
      })
    )
  })
})
