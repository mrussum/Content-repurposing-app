import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/generate/route'
import { makeMockSupabase, MOCK_GENERATION_RESULT } from '../helpers/supabase'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the Anthropic generate function
vi.mock('@/lib/anthropic/generate', () => ({
  generateContent:  vi.fn(),
  checkTokenBudget: vi.fn(), // no-op: don't throw
}))

// Mock the rate limiter — allow all requests by default
vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 99, reset: 0 }),
}))

import { createClient } from '@/lib/supabase/server'
import { generateContent, checkTokenBudget } from '@/lib/anthropic/generate'
import { checkRateLimit } from '@/lib/ratelimit'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const VALID_BODY = {
  content:  'This is my test article about content marketing strategies.',
  tone:     'professional',
  audience: 'founders',
}

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateContent).mockResolvedValue(MOCK_GENERATION_RESULT as never)
    vi.mocked(checkTokenBudget).mockImplementation(() => undefined)
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 99, reset: 0 })
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as never)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing required fields', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)

    const res = await POST(makeRequest({ tone: 'professional' })) // missing content
    expect(res.status).toBe(400)
  })

  it('returns 400 when content exceeds 10,000 chars', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)

    const res = await POST(makeRequest({
      ...VALID_BODY,
      content: 'a'.repeat(10_001),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid tone', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)

    const res = await POST(makeRequest({ ...VALID_BODY, tone: 'aggressive' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase({ plan: 'free' }) as never)
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: Date.now() })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)

    const body = await res.json() as { upgrade?: boolean }
    expect(body.upgrade).toBe(true)
  })

  it('returns 400 when free user tries to use brandVoiceId', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase({ plan: 'free' }) as never)

    const res = await POST(makeRequest({
      ...VALID_BODY,
      brandVoiceId: '550e8400-e29b-41d4-a716-446655440000',
    }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Brand Voice')
  })

  it('returns 200 with generation result for valid request', async () => {
    const supabase = makeMockSupabase({ plan: 'free' })

    // Mock insert to return a generation ID
    supabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              plan: 'free',
              generations_used: 0,
              generations_reset_at: new Date().toISOString(),
            },
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
        }
      }
      if (table === 'generations') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'gen-123' }, error: null }),
          update: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const res  = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json() as { id: string; result: typeof MOCK_GENERATION_RESULT }
    expect(body.result.summary).toBe(MOCK_GENERATION_RESULT.summary)
    expect(body.result.twitter.tweets).toHaveLength(2)
  })

  it('calls generateContent with the correct parameters', async () => {
    const supabase = makeMockSupabase({ plan: 'pro' })
    supabase.from.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === 'profiles'
          ? { plan: 'pro', generations_used: 5, generations_reset_at: new Date().toISOString() }
          : table === 'generations'
          ? { id: 'gen-123' }
          : null,
        error: null,
      }),
    }))
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await POST(makeRequest({ ...VALID_BODY, twitterLength: 10 }))

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        content:       VALID_BODY.content,
        tone:          'professional',
        audience:      'founders',
        twitterLength: 10,
      })
    )
  })
})
