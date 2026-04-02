import type { Plan } from './generation'

export type { Plan }

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'unpaid'

export interface PlanFeatures {
  dailyGenerations: number
  instagramCarousel: boolean
  brandVoice: boolean
  brandVoiceSlots: number
  regenerate: boolean
  bufferPublishing: boolean
  history: boolean
  export: boolean
  apiAccess: boolean
  whiteLabel: boolean
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    dailyGenerations: 3,
    instagramCarousel: false,
    brandVoice: false,
    brandVoiceSlots: 0,
    regenerate: false,
    bufferPublishing: false,
    history: false,
    export: false,
    apiAccess: false,
    whiteLabel: false,
  },
  pro: {
    dailyGenerations: 100,
    instagramCarousel: true,
    brandVoice: true,
    brandVoiceSlots: 1,
    regenerate: true,
    bufferPublishing: true,
    history: true,
    export: true,
    apiAccess: false,
    whiteLabel: false,
  },
  agency: {
    dailyGenerations: Infinity,
    instagramCarousel: true,
    brandVoice: true,
    brandVoiceSlots: 5,
    regenerate: true,
    bufferPublishing: true,
    history: true,
    export: true,
    apiAccess: true,
    whiteLabel: true,
  },
}
