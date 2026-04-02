import Anthropic from '@anthropic-ai/sdk'

export const MODEL = 'claude-sonnet-4-20250514'

export const TOKEN_LIMITS = {
  generation:        3000,
  regeneration:       800,
  brandVoiceAnalysis: 400,
} as const

// Lazy — instantiated on first use so build doesn't fail without env vars
let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}
