import Stripe from 'stripe'

// Lazy — instantiated on first use so build doesn't fail without env vars
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
      typescript:  true,
    })
  }
  return _stripe
}

// Named export kept for backwards compat — prefer getStripe() in route handlers
export const stripe = { get instance() { return getStripe() } }
