import { describe, it, expect } from 'vitest'
import { PLANS, getPlanLimit, getPriceId, isPro } from '@/lib/stripe/plans'
import { PLAN_FEATURES } from '@/types/billing'

describe('PLANS', () => {
  it('free plan has no stripe price ID', () => {
    expect(PLANS.free.stripePriceId).toBeNull()
  })

  it('free plan allows 3 generations per day', () => {
    expect(PLANS.free.dailyGenerations).toBe(3)
  })

  it('pro plan costs $12', () => {
    expect(PLANS.pro.price).toBe(12)
  })

  it('agency plan costs $49', () => {
    expect(PLANS.agency.price).toBe(49)
  })

  it('agency plan has unlimited generations', () => {
    expect(PLANS.agency.dailyGenerations).toBe(Infinity)
  })
})

describe('getPlanLimit', () => {
  it('returns 3 for free', () => {
    expect(getPlanLimit('free')).toBe(3)
  })

  it('returns 100 for pro', () => {
    expect(getPlanLimit('pro')).toBe(100)
  })

  it('returns Infinity for agency', () => {
    expect(getPlanLimit('agency')).toBe(Infinity)
  })
})

describe('isPro', () => {
  it('returns false for free', () => {
    expect(isPro('free')).toBe(false)
  })

  it('returns true for pro', () => {
    expect(isPro('pro')).toBe(true)
  })

  it('returns true for agency', () => {
    expect(isPro('agency')).toBe(true)
  })
})

describe('getPriceId', () => {
  it('returns null for pro when env var is not set', () => {
    // In test env, STRIPE_PRO_PRICE_ID is not set
    expect(getPriceId('pro')).toBeNull()
  })
})

describe('PLAN_FEATURES', () => {
  it('free plan cannot use instagram carousel', () => {
    expect(PLAN_FEATURES.free.instagramCarousel).toBe(false)
  })

  it('free plan cannot use brand voice', () => {
    expect(PLAN_FEATURES.free.brandVoice).toBe(false)
  })

  it('pro plan can use instagram carousel', () => {
    expect(PLAN_FEATURES.pro.instagramCarousel).toBe(true)
  })

  it('pro plan has 1 brand voice slot', () => {
    expect(PLAN_FEATURES.pro.brandVoiceSlots).toBe(1)
  })

  it('agency plan has 5 brand voice slots', () => {
    expect(PLAN_FEATURES.agency.brandVoiceSlots).toBe(5)
  })

  it('agency plan has API access', () => {
    expect(PLAN_FEATURES.agency.apiAccess).toBe(true)
  })

  it('pro plan does not have API access', () => {
    expect(PLAN_FEATURES.pro.apiAccess).toBe(false)
  })

  it('free plan has 0 brand voice slots', () => {
    expect(PLAN_FEATURES.free.brandVoiceSlots).toBe(0)
  })
})
