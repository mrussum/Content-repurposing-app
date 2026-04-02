import { z } from 'zod'
import { getAnthropicClient, MODEL, TOKEN_LIMITS } from './client'
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRegeneratePrompt,
  buildBrandVoiceAnalysisPrompt,
} from './prompts'
import { estimateTokens } from '@/lib/utils'
import type {
  Tone,
  Audience,
  TwitterLength,
  GenerationResult,
  FormatKey,
} from '@/types/generation'

// Zod schema mirrors GenerationResult for runtime validation
const InstagramSlideSchema = z.object({
  slide:    z.number(),
  type:     z.enum(['hook', 'problem', 'insight', 'data', 'tip', 'cta']),
  headline: z.string(),
  body:     z.string(),
})

const BlogSectionSchema = z.object({
  heading: z.string(),
  points:  z.array(z.string()),
})

const GenerationResultSchema = z.object({
  summary:     z.string(),
  twitter:     z.object({ tweets: z.array(z.string()) }),
  linkedin:    z.string(),
  instagram:   z.array(InstagramSlideSchema),
  blogOutline: z.array(BlogSectionSchema),
  newsletter:  z.string(),
  quotes:      z.array(z.string()),
})

export interface GenerateParams {
  content: string
  tone: Tone
  audience: Audience
  twitterLength?: TwitterLength
  brandVoiceSummary?: string
  brandVoiceSamples?: string[]
}

// Enforced before calling Claude to prevent runaway costs
const MAX_INPUT_TOKENS = 4000

export function checkTokenBudget(content: string): void {
  const estimated = estimateTokens(content)
  if (estimated > MAX_INPUT_TOKENS) {
    throw new Error(
      `Content is too long (estimated ${estimated} tokens, max ${MAX_INPUT_TOKENS}). Please shorten your content.`
    )
  }
}

export async function generateContent(params: GenerateParams): Promise<GenerationResult> {
  const {
    content,
    tone,
    audience,
    twitterLength = 7,
    brandVoiceSummary,
    brandVoiceSamples,
  } = params

  const system = buildSystemPrompt(tone, audience, twitterLength, brandVoiceSummary, brandVoiceSamples)
  const user   = buildUserPrompt(content)

  const raw = await callClaude(system, user, TOKEN_LIMITS.generation)
  return parseGenerationResult(raw, system, user)
}

export async function regenerateFormat(
  format: FormatKey,
  originalContent: string,
  currentOutput: string,
  instruction?: string
): Promise<unknown> {
  const { system, user } = buildRegeneratePrompt(format, originalContent, currentOutput, instruction)
  const raw = await callClaude(system, user, TOKEN_LIMITS.regeneration)

  // Regeneration returns just the format value (not a full GenerationResult object)
  try {
    return JSON.parse(raw)
  } catch {
    // If it's not JSON (e.g. summary, linkedin, newsletter are plain strings), return as-is
    return raw.trim()
  }
}

export async function analyzeBrandVoice(samples: string[]): Promise<string> {
  const user = buildBrandVoiceAnalysisPrompt(samples)
  const raw  = await callClaude(
    'You are a writing analyst. Return only the voice fingerprint text.',
    user,
    TOKEN_LIMITS.brandVoiceAnalysis
  )
  return raw.trim()
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function callClaude(
  system: string,
  user:   string,
  maxTokens: number
): Promise<string> {
  const message = await getAnthropicClient().messages.create({
    model:      MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

async function parseGenerationResult(
  raw: string,
  system: string,
  user: string
): Promise<GenerationResult> {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    // Known issue: Claude sometimes returns invalid JSON. Retry once with an
    // explicit reminder. This is cheaper than structured outputs for this use case.
    const retry = await callClaude(
      system + '\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY the JSON object now.',
      user,
      TOKEN_LIMITS.generation
    )
    try {
      parsed = JSON.parse(retry)
    } catch {
      throw new Error('Claude returned invalid JSON after retry')
    }
  }

  const result = GenerationResultSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Generation result failed validation: ${result.error.message}`)
  }

  return result.data
}
