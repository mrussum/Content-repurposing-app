import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/usage/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function makeProfileMock(plan: string, used: number) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          plan,
          generations_used:     used,
          generations_reset_at: '2024-01-15T00:00:00.000Z',
        },
        error: null,
      }),
    }),
  }
}

describe('GET /api/usage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as never)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns correct usage for free plan', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProfileMock('free', 2) as never)

    const res  = await GET()
    const body = await res.json() as { used: number; limit: number; plan: string }

    expect(res.status).toBe(200)
    expect(body.used).toBe(2)
    expect(body.limit).toBe(3)
    expect(body.plan).toBe('free')
  })

  it('returns correct usage for pro plan', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProfileMock('pro', 50) as never)

    const res  = await GET()
    const body = await res.json() as { used: number; limit: number; plan: string }

    expect(body.limit).toBe(100)
    expect(body.plan).toBe('pro')
  })

  it('returns Infinity limit for agency plan', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProfileMock('agency', 500) as never)

    const res  = await GET()
    // JSON.stringify converts Infinity to null
    const text = await res.text()
    expect(text).toContain('null') // Infinity serialized as null in JSON
    expect(text).toContain('"plan":"agency"')
  })

  it('includes resetsAt in the response', async () => {
    vi.mocked(createClient).mockResolvedValue(makeProfileMock('free', 1) as never)

    const res  = await GET()
    const body = await res.json() as { resetsAt: string }
    expect(body.resetsAt).toBe('2024-01-15T00:00:00.000Z')
  })
})
