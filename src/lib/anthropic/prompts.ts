import type { Tone, Audience, TwitterLength } from '@/types/generation'

// Quality guardrails injected into every generation system prompt
const QUALITY_GUARDRAILS = `
QUALITY GUARDRAILS (strictly enforce):
- Twitter: Each tweet MUST be under 280 characters. Number them 1/ through N/. No hashtags unless present in brand voice samples. Tweet 1 must stand alone as a hook. Last tweet is a CTA or reflection, never "follow me for more".
- LinkedIn: First line is the hook — punchy, no subject, makes you click "see more". 250-350 words. Max 3 hashtags at end. No "In today's fast-paced world". No "game-changer" or "I'm excited to share".
- Instagram: Each headline max 8 words. Each body max 2 sentences. Slide types in order: hook, problem, insight, data, tip, tip, cta.
- Blog outline: Min 3 points per section. Headings are benefit-driven ("How to X" not just "X"). Min 5 sections.
- Newsletter: 120-150 words. Flowing prose only, no bullet points. One specific action the reader can take this week.
- Quotes: 4 quotes. 10-25 words each. Self-contained — no "he said" needed. Do not start with "I".
`.trim()

// The exact JSON schema the model must return — key names must match GenerationResult
const JSON_SCHEMA = `
Return ONLY valid JSON matching this exact schema. No prose, no markdown fences, no explanation:

{
  "summary": "2-3 sentence standalone insight",
  "twitter": {
    "tweets": ["1/ Hook tweet", "2/ Insight tweet", "..."]
  },
  "linkedin": "Full LinkedIn post text",
  "instagram": [
    { "slide": 1, "type": "hook", "headline": "Max 8 word headline", "body": "1-2 sentence body" },
    { "slide": 2, "type": "problem", "headline": "...", "body": "..." },
    { "slide": 3, "type": "insight", "headline": "...", "body": "..." },
    { "slide": 4, "type": "data", "headline": "...", "body": "..." },
    { "slide": 5, "type": "tip", "headline": "...", "body": "..." },
    { "slide": 6, "type": "tip", "headline": "...", "body": "..." },
    { "slide": 7, "type": "cta", "headline": "...", "body": "..." }
  ],
  "blogOutline": [
    { "heading": "Benefit-driven section heading", "points": ["point 1", "point 2", "point 3"] }
  ],
  "newsletter": "120-150 word newsletter segment prose",
  "quotes": ["Quote one", "Quote two", "Quote three", "Quote four"]
}
`.trim()

const JSON_SCHEMA_STRICT = `
CRITICAL: Output ONLY the JSON object. No text before or after. No \`\`\`json fences.
The JSON must be parseable by JSON.parse() with zero modifications.
`.trim()

export function buildSystemPrompt(
  tone: Tone,
  audience: Audience,
  twitterLength: TwitterLength = 7,
  brandVoiceSummary?: string,
  brandVoiceSamples?: string[],
  templateAddon?: string
): string {
  const toneInstructions: Record<Tone, string> = {
    professional: 'Write with authority and precision. Clear, structured, credible. No fluff.',
    casual:       'Write conversationally, like texting a smart friend. Approachable and direct.',
    witty:        'Write with dry humor and clever observations. Sharp, not goofy.',
    educational:  'Write to teach. Break down complexity. Use concrete examples and analogies.',
  }

  const audienceInstructions: Record<Audience, string> = {
    general:    'Write for a broad, intelligent audience. Avoid jargon.',
    founders:   'Write for founders and entrepreneurs. Reference product, growth, and execution.',
    marketers:  'Write for content and growth marketers. Reference channels, conversion, and audience.',
    developers: 'Write for software engineers. Technical accuracy matters. Respect their intelligence.',
  }

  let voiceBlock = ''
  if (brandVoiceSummary) {
    // Sanitize samples to prevent prompt injection
    const safeSamples = (brandVoiceSamples ?? [])
      .map((s) =>
        s
          .slice(0, 600)
          .replace(/<\|/g, '')
          .replace(/\|>/g, '')
          .replace(/###/g, '')
          .replace(/\bINST\b/g, '')
      )
      .join('\n\n---\n\n')

    voiceBlock = `
VOICE MATCHING:
Mirror the user's writing voice precisely. Their voice characteristics: ${brandVoiceSummary}
Writing samples for reference:
${safeSamples}
The output must feel like the user wrote it themselves.
`.trim()
  }

  // Truncate template addon to prevent runaway prompt size
  const templateBlock = templateAddon
    ? `TEMPLATE STYLE:\n${templateAddon.slice(0, 1000)}`
    : ''

  return [
    `You are an expert content strategist and copywriter.`,
    `TONE: ${toneInstructions[tone]}`,
    `AUDIENCE: ${audienceInstructions[audience]}`,
    `TWITTER THREAD LENGTH: ${twitterLength} tweets.`,
    voiceBlock,
    templateBlock,
    QUALITY_GUARDRAILS,
    JSON_SCHEMA,
    JSON_SCHEMA_STRICT,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildUserPrompt(content: string): string {
  return `Transform the following content into all 7 formats as specified:\n\n${content}`
}

export function buildRegeneratePrompt(
  format: string,
  originalContent: string,
  currentOutput: string,
  instruction?: string
): { system: string; user: string } {
  const instructionBlock = instruction
    ? `Additional instruction: ${instruction}`
    : 'Improve this format while keeping the same core message.'

  const system = `You are an expert content strategist. Regenerate ONLY the "${format}" format.
${instructionBlock}
Return ONLY the value for the "${format}" key — no wrapper object, no other formats.
${JSON_SCHEMA_STRICT}`

  const user = `Original content:\n${originalContent}\n\nCurrent ${format} output:\n${currentOutput}\n\nRegenerate the ${format} format now.`

  return { system, user }
}

export function buildBrandVoiceAnalysisPrompt(samples: string[]): string {
  const joined = samples
    .map((s, i) => `Sample ${i + 1}:\n${s.slice(0, 600)}`)
    .join('\n\n---\n\n')

  return `Analyze these writing samples and extract a concise voice fingerprint (2-4 sentences). Cover: vocabulary level, sentence length preference, energy level, structural patterns, and any signature phrases. Be specific, not generic. Return only the fingerprint text, no labels or headers.\n\n${joined}`
}
