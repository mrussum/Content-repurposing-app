import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash Redis is edge-compatible. Do not substitute ioredis or node-redis.
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const freeRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(3, '24 h'),
  analytics: true,
  prefix:    'rl:free',
})

export const proRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(100, '24 h'),
  analytics: true,
  prefix:    'rl:pro',
})

export async function checkRateLimit(
  userId: string,
  plan: 'free' | 'pro' | 'agency'
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // Agency users are unlimited — skip Redis check
  if (plan === 'agency') {
    return { success: true, remaining: Infinity, reset: 0 }
  }

  const limiter = plan === 'pro' ? proRatelimit : freeRatelimit
  const { success, remaining, reset } = await limiter.limit(userId)
  return { success, remaining, reset }
}
