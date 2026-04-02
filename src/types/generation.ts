export type Tone = 'professional' | 'casual' | 'witty' | 'educational'
export type Audience = 'general' | 'founders' | 'marketers' | 'developers'
export type FormatKey =
  | 'summary'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'blog'
  | 'newsletter'
  | 'quotes'

export interface TwitterThread {
  tweets: string[]
}

export interface InstagramSlide {
  slide: number
  type: 'hook' | 'problem' | 'insight' | 'data' | 'tip' | 'cta'
  headline: string
  body: string
}

export interface BlogSection {
  heading: string
  points: string[]
}

export interface GenerationResult {
  summary: string
  twitter: TwitterThread
  linkedin: string
  instagram: InstagramSlide[]
  blogOutline: BlogSection[]
  newsletter: string
  quotes: string[]
}

export type Plan = 'free' | 'pro' | 'agency'

export interface UsageInfo {
  used: number
  limit: number
  resetsAt: string
  plan: Plan
}

export interface Generation {
  id: string
  userId: string
  contentInput: string
  result: GenerationResult
  tone: Tone
  audience: Audience
  brandVoiceId: string | null
  wordCount: number | null
  createdAt: string
}

export type TwitterLength = 5 | 7 | 10

export interface GenerateRequest {
  content: string
  tone: Tone
  audience: Audience
  brandVoiceId?: string
  twitterLength?: TwitterLength
}

export interface GenerateResponse {
  id: string
  result: GenerationResult
  usage: UsageInfo
}

export interface RegenerateRequest {
  generationId: string
  format: FormatKey
  instruction?: string
}

export interface BrandVoice {
  id: string
  userId: string
  name: string
  samples: string[]
  summary: string | null
  createdAt: string
  updatedAt: string
}
