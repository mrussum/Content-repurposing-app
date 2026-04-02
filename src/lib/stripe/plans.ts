import type { Plan } from '@/types/generation'

export const PLANS = {
  free: {
    name:              'Free',
    price:             0,
    dailyGenerations:  3,
    features: ['6 formats', 'Basic tone control', '3 generations/day'],
    stripePriceId:     null,
  },
  pro: {
    name:              'Pro',
    price:             12,
    dailyGenerations:  100,
    features: [
      'All 7 formats including Instagram Carousel',
      'Brand Voice matching',
      'Per-format regeneration',
      'Direct publishing via Buffer',
      'Full generation history',
      '100 generations/day',
      'Export (JSON, Markdown, plain text)',
    ],
    stripePriceId:     process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  agency: {
    name:              'Agency',
    price:             49,
    dailyGenerations:  Infinity,
    features: [
      'Everything in Pro',
      'Unlimited generations',
      '5 Brand Voices',
      'API access',
      'White-label ready',
      'Priority support',
    ],
    stripePriceId:     process.env.STRIPE_AGENCY_PRICE_ID ?? null,
  },
} as const

export function getPlanLimit(plan: Plan): number {
  return PLANS[plan].dailyGenerations
}

export function getPriceId(plan: Exclude<Plan, 'free'>): string | null {
  return PLANS[plan].stripePriceId
}

export function isPro(plan: Plan): boolean {
  return plan === 'pro' || plan === 'agency'
}
