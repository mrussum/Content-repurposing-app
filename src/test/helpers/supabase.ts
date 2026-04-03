import { vi } from 'vitest'

// A valid GenerationResult for use in tests
export const MOCK_GENERATION_RESULT = {
  summary:  'A great summary.',
  twitter:  { tweets: ['1/ First tweet', '2/ Second tweet'] },
  linkedin: 'Great LinkedIn post.',
  instagram: [
    { slide: 1, type: 'hook',    headline: 'Hook',    body: 'Hook body.' },
    { slide: 2, type: 'problem', headline: 'Problem', body: 'Problem body.' },
    { slide: 3, type: 'insight', headline: 'Insight', body: 'Insight body.' },
    { slide: 4, type: 'data',    headline: 'Data',    body: 'Data body.' },
    { slide: 5, type: 'tip',     headline: 'Tip 1',   body: 'Tip body.' },
    { slide: 6, type: 'tip',     headline: 'Tip 2',   body: 'Tip body.' },
    { slide: 7, type: 'cta',     headline: 'CTA',     body: 'CTA body.' },
  ],
  blogOutline: [
    { heading: 'Introduction', points: ['Point A', 'Point B', 'Point C'] },
    { heading: 'Section Two',  points: ['Point D', 'Point E', 'Point F'] },
  ],
  newsletter: 'Newsletter content.',
  quotes:     ['Quote 1', 'Quote 2', 'Quote 3', 'Quote 4'],
}

type Plan = 'free' | 'pro' | 'agency'

interface MockProfileOptions {
  plan?:              Plan
  generationsUsed?:   number
  stripeCustomerId?:  string
  subscriptionId?:    string
  email?:             string
}

/**
 * Returns a Supabase client mock configured for a user with the given plan.
 * Pass this to vi.mock('@/lib/supabase/server', ...) in test files.
 */
export function makeMockSupabase(options: MockProfileOptions = {}) {
  const {
    plan            = 'free',
    generationsUsed = 0,
    stripeCustomerId  = null,
    subscriptionId    = null,
    email             = 'test@example.com',
  } = options

  const profile = {
    id:                     'user-id-123',
    email,
    plan,
    generations_used:       generationsUsed,
    generations_reset_at:   new Date().toISOString(),
    stripe_customer_id:     stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    has_onboarded:          true,
    buffer_access_token:    null,
    full_name:              'Test User',
    avatar_url:             null,
    created_at:             new Date().toISOString(),
    updated_at:             new Date().toISOString(),
  }

  const mockGeneration = {
    id:            'gen-id-456',
    user_id:       'user-id-123',
    content_input: 'Test content input',
    result:        MOCK_GENERATION_RESULT,
    tone:          'professional',
    audience:      'general',
    brand_voice_id: null,
    word_count:    3,
    created_at:    new Date().toISOString(),
  }

  const mockSingle = (data: unknown, error = null) => ({
    data,
    error,
  })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-id-123', email } },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles'
          ? mockSingle(profile)
          : table === 'generations'
          ? mockSingle(mockGeneration)
          : mockSingle(null)
      ),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return supabase
}

export const MOCK_USER_ID = 'user-id-123'
