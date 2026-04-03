import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/stripe/route'

// Mock Stripe — constructEvent must be controllable per test
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/resend/client', () => ({
  sendWelcomeEmail:      vi.fn().mockResolvedValue(undefined),
  sendCancellationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendCancellationEmail } from '@/lib/resend/client'

const FAKE_SIGNATURE = 'whsec_test_signature'

function makeWebhookRequest(body: string) {
  return new Request('http://localhost/api/webhooks/stripe', {
    method:  'POST',
    headers: { 'stripe-signature': FAKE_SIGNATURE },
    body,
  })
}

function makeAdminSupabase(profileData = { email: 'user@test.com', full_name: 'Test User' }) {
  const updateMock = vi.fn().mockReturnThis()
  const eqMock     = vi.fn().mockReturnThis()
  const singleMock = vi.fn().mockResolvedValue({ data: profileData, error: null })

  return {
    from: vi.fn().mockReturnValue({
      update: updateMock,
      select: vi.fn().mockReturnThis(),
      eq:     eqMock,
      single: singleMock,
    }),
    _updateMock: updateMock,
    _eqMock:     eqMock,
  }
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body:   '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error('Invalid signature')
        }),
      },
    } as never)

    const res = await POST(makeWebhookRequest('{}'))
    expect(res.status).toBe(400)
  })

  describe('checkout.session.completed', () => {
    it('updates profile plan to pro and sends welcome email', async () => {
      const admin = makeAdminSupabase()
      vi.mocked(createAdminClient).mockResolvedValue(admin as never)
      vi.mocked(getStripe).mockReturnValue({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            type: 'checkout.session.completed',
            data: {
              object: {
                customer:     'cus_123',
                subscription: 'sub_456',
                metadata:     { supabase_user_id: 'uid-1', plan: 'pro' },
              },
            },
          }),
        },
      } as never)

      const res = await POST(makeWebhookRequest('{}'))
      expect(res.status).toBe(200)

      // Profile update was called
      expect(admin.from).toHaveBeenCalledWith('profiles')
      expect(sendWelcomeEmail).toHaveBeenCalledWith('user@test.com', 'Test User')
    })

    it('upgrades to agency plan when metadata specifies agency', async () => {
      const admin    = makeAdminSupabase()
      const updateFn = vi.fn().mockReturnThis()
      admin.from.mockReturnValue({ update: updateFn, select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { email: 'u@e.com', full_name: null }, error: null }) })

      vi.mocked(createAdminClient).mockResolvedValue(admin as never)
      vi.mocked(getStripe).mockReturnValue({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            type: 'checkout.session.completed',
            data: {
              object: {
                customer:     'cus_abc',
                subscription: 'sub_xyz',
                metadata:     { supabase_user_id: 'uid-2', plan: 'agency' },
              },
            },
          }),
        },
      } as never)

      await POST(makeWebhookRequest('{}'))

      // The update call should include plan: 'agency'
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'agency' })
      )
    })
  })

  describe('customer.subscription.deleted', () => {
    it('downgrades profile to free plan and sends cancellation email', async () => {
      const admin    = makeAdminSupabase()
      const updateFn = vi.fn().mockReturnThis()
      admin.from.mockReturnValue({ update: updateFn, select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { email: 'cancel@test.com', full_name: 'Canceller' }, error: null }) })

      vi.mocked(createAdminClient).mockResolvedValue(admin as never)
      vi.mocked(getStripe).mockReturnValue({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            type: 'customer.subscription.deleted',
            data: {
              object: {
                id:       'sub_456',
                metadata: { supabase_user_id: 'uid-1' },
              },
            },
          }),
        },
      } as never)

      const res = await POST(makeWebhookRequest('{}'))
      expect(res.status).toBe(200)

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'free', stripe_subscription_id: null })
      )
      expect(sendCancellationEmail).toHaveBeenCalledWith('cancel@test.com', 'Canceller')
    })
  })

  describe('customer.subscription.updated', () => {
    it('keeps plan active when subscription status is active', async () => {
      const admin    = makeAdminSupabase()
      const updateFn = vi.fn().mockReturnThis()
      admin.from.mockReturnValue({ update: updateFn, eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })

      vi.mocked(createAdminClient).mockResolvedValue(admin as never)
      vi.mocked(getStripe).mockReturnValue({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            type: 'customer.subscription.updated',
            data: {
              object: {
                id:       'sub_456',
                status:   'active',
                metadata: { supabase_user_id: 'uid-1', plan: 'pro' },
              },
            },
          }),
        },
      } as never)

      await POST(makeWebhookRequest('{}'))

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'pro' })
      )
    })

    it('downgrades to free when subscription status is past_due', async () => {
      const admin    = makeAdminSupabase()
      const updateFn = vi.fn().mockReturnThis()
      admin.from.mockReturnValue({ update: updateFn, eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })

      vi.mocked(createAdminClient).mockResolvedValue(admin as never)
      vi.mocked(getStripe).mockReturnValue({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            type: 'customer.subscription.updated',
            data: {
              object: {
                id:       'sub_456',
                status:   'past_due',
                metadata: { supabase_user_id: 'uid-1', plan: 'pro' },
              },
            },
          }),
        },
      } as never)

      await POST(makeWebhookRequest('{}'))

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'free' })
      )
    })
  })

  it('always returns 200 even when internal processing fails', async () => {
    vi.mocked(createAdminClient).mockRejectedValue(new Error('DB connection failed'))
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: { customer: 'c', subscription: 's', metadata: { supabase_user_id: 'uid' } } },
        }),
      },
    } as never)

    const res = await POST(makeWebhookRequest('{}'))
    // Must always return 200 — never throw on internal errors
    expect(res.status).toBe(200)
  })
})
