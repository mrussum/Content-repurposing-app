# CLAUDE.md — Content Studio Pro

## Operational Guide for Claude Code

> Read this file completely before touching any code. It contains every convention,
> constraint, and decision this project has already made. Do not re-litigate them.

-----

## 1. What This Project Is

**Content Studio Pro** is a SaaS web application that transforms a single piece of
content (article, transcript, notes) into 7 platform-ready formats using the
Anthropic Claude API. It targets content creators, indie founders, and marketers
who need to maintain a multi-platform presence without a content team.

**Core value proposition:** Paste once → get Twitter thread, LinkedIn post,
Instagram carousel, blog outline, newsletter segment, summary, and key quotes
— all tuned to the user’s brand voice, tone, and audience — in under 30 seconds.

**Key differentiator:** Brand Voice matching. Users paste writing samples; the
app learns their vocabulary, rhythm, and energy and mirrors it across all formats.

-----

## 2. Tech Stack (Non-Negotiable)

|Layer                |Choice                                         |Why                         |
|---------------------|-----------------------------------------------|----------------------------|
|Frontend framework   |React 18 + Vite                                |Fast HMR, small bundle      |
|Language             |TypeScript (strict)                            |Type safety throughout      |
|Styling              |Tailwind CSS v3                                |Utility-first, no CSS files |
|UI components        |shadcn/ui                                      |Accessible, composable      |
|Auth                 |Supabase Auth                                  |Email magic link + OAuth    |
|Database             |Supabase Postgres                              |Row-level security built in |
|ORM                  |Supabase JS client                             |No extra ORM layer          |
|Payments             |Stripe Checkout + Portal                       |Industry standard           |
|AI                   |Anthropic Claude API (claude-sonnet-4-20250514)|Core product                |
|Scheduling/Publishing|Buffer API                                     |Publish to socials directly |
|Deployment           |Vercel                                         |Edge functions + CDN        |
|Analytics            |Posthog                                        |Self-hostable, event-based  |
|Error tracking       |Sentry                                         |Frontend + serverless errors|
|Email                |Resend                                         |Transactional emails        |

**Do not introduce new dependencies without a strong reason.** Every new package
must be justified in a code comment at the import site.

-----

## 3. Project Structure

```
content-studio/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── generate/
│   │   │   ├── history/
│   │   │   ├── settings/
│   │   │   └── brand-voice/
│   │   ├── api/
│   │   │   ├── generate/       # Main AI generation endpoint
│   │   │   ├── regenerate/     # Single-format regeneration
│   │   │   ├── publish/        # Buffer publishing endpoint
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   └── usage/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (do not edit)
│   │   ├── studio/             # Feature components
│   │   │   ├── GeneratePanel.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── InstagramCarousel.tsx
│   │   │   ├── BrandVoiceEditor.tsx
│   │   │   ├── FormatTab.tsx
│   │   │   ├── HistorySidebar.tsx
│   │   │   └── PublishModal.tsx
│   │   ├── billing/
│   │   │   ├── UpgradeModal.tsx
│   │   │   └── UsageMeter.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client (cookies)
│   │   │   └── middleware.ts
│   │   ├── anthropic/
│   │   │   ├── client.ts
│   │   │   ├── prompts.ts      # All system prompts
│   │   │   └── generate.ts     # Generation logic
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── plans.ts        # Plan definitions
│   │   ├── buffer/
│   │   │   └── client.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useGenerate.ts
│   │   ├── useUsage.ts
│   │   ├── useBrandVoice.ts
│   │   └── useHistory.ts
│   ├── stores/
│   │   └── studioStore.ts      # Zustand global state
│   ├── types/
│   │   ├── generation.ts
│   │   ├── billing.ts
│   │   └── database.ts         # Auto-generated from Supabase
│   └── styles/
│       └── globals.css
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── .env.local                  # Never commit
├── .env.example                # Commit this
├── CLAUDE.md                   # This file
├── BIBLE.md                    # Product bible
└── package.json
```

-----

## 4. Database Schema

### profiles

```sql
id            uuid references auth.users primary key
email         text not null
full_name     text
avatar_url    text
plan          text not null default 'free'  -- 'free' | 'pro' | 'agency'
stripe_customer_id   text unique
stripe_subscription_id text unique
generations_used     int not null default 0
generations_reset_at timestamptz not null default now()
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

### generations

```sql
id            uuid primary key default gen_random_uuid()
user_id       uuid references profiles(id) on delete cascade
content_input text not null
result        jsonb not null           -- Full GenerationResult object
tone          text not null
audience      text not null
brand_voice_id uuid references brand_voices(id)
word_count    int
created_at    timestamptz default now()
```

### brand_voices

```sql
id            uuid primary key default gen_random_uuid()
user_id       uuid references profiles(id) on delete cascade
name          text not null default 'My Brand Voice'
samples       text[] not null          -- Array of writing samples
summary       text                     -- AI-generated style summary
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

### published_posts

```sql
id            uuid primary key default gen_random_uuid()
user_id       uuid references profiles(id) on delete cascade
generation_id uuid references generations(id)
platform      text not null            -- 'twitter' | 'linkedin' | etc
content       text not null
buffer_post_id text
status        text not null default 'draft'
scheduled_at  timestamptz
published_at  timestamptz
created_at    timestamptz default now()
```

**Row Level Security is enabled on all tables. Every query goes through the
Supabase client which applies RLS automatically. Never bypass RLS.**

-----

## 5. API Endpoints

### POST /api/generate

**Auth required.** Generates all 7 formats.

Request:

```typescript
{
  content: string        // Max 10,000 chars
  tone: Tone
  audience: Audience
  brandVoiceId?: string  // Pro only
  twitterLength?: number // 5 | 7 | 10, default 7
}
```

Response:

```typescript
{
  id: string             // generation UUID
  result: GenerationResult
  usage: UsageInfo
}
```

**Rate limit:** Free: 3/day. Pro: 100/day. Agency: unlimited.
**Cost guard:** Reject if estimated tokens > 4000 to prevent runaway costs.

### POST /api/regenerate

**Auth + Pro required.** Regenerates a single format.

Request:

```typescript
{
  generationId: string
  format: FormatKey
  instruction?: string   // Optional user guidance: "make it funnier"
}
```

### POST /api/publish

**Auth + Pro required.** Publishes to Buffer.

Request:

```typescript
{
  generationId: string
  format: FormatKey
  content: string
  scheduledAt?: string   // ISO date or null for immediate
}
```

### POST /api/webhooks/stripe

**No auth (Stripe signature verification instead).**
Handles: checkout.session.completed, customer.subscription.updated,
customer.subscription.deleted, invoice.payment_failed.

-----

## 6. Core Types

```typescript
// src/types/generation.ts

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
  tweets: string[]       // Each max 280 chars
}

export interface InstagramSlide {
  slide: number
  type: 'hook' | 'problem' | 'insight' | 'data' | 'tip' | 'cta'
  headline: string       // Max 8 words
  body: string           // 1-2 sentences
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
```

-----

## 7. AI Prompt Architecture

All prompts live in `src/lib/anthropic/prompts.ts`. Never inline prompts.

### System Prompt Structure

```
[Role] + [Tone instruction] + [Audience instruction] + [Brand Voice block if present]
+ [Output format spec — exact JSON schema]
+ [Quality guardrails]
+ [Strict JSON-only instruction]
```

### Quality Guardrails (always include)

```
- Twitter: Each tweet must be under 280 characters. Number them 1/ through N/.
- LinkedIn: Must have a hook in the first line. No hashtag spam (max 3).
- Instagram: Headline max 8 words. Body max 2 sentences. Type must match purpose.
- Blog outline: Minimum 3 points per section.
- Newsletter: Must include one actionable step for the reader.
- Quotes: Must be self-contained. No "he said" or attribution needed.
```

### Token Budget

- Generation call: max_tokens 3000
- Regeneration call: max_tokens 800
- Brand voice analysis call: max_tokens 400

**Never exceed these limits.** Set them explicitly in every API call.

-----

## 8. Billing & Plans

```typescript
// src/lib/stripe/plans.ts

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    dailyGenerations: 3,
    features: ['5 formats', 'Basic tone control', '3 generations/day'],
    stripePriceId: null,
  },
  pro: {
    name: 'Pro',
    price: 12,          // USD/month
    dailyGenerations: 100,
    features: [
      '7 formats including Instagram Carousel',
      'Brand Voice matching',
      'Per-format regeneration',
      'Direct publishing via Buffer',
      'Full generation history',
      '100 generations/day',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  agency: {
    name: 'Agency',
    price: 49,
    dailyGenerations: Infinity,
    features: [
      'Everything in Pro',
      'Unlimited generations',
      '5 Brand Voices',
      'White-label ready',
      'Priority support',
      'API access',
    ],
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
  },
} as const
```

**Stripe Webhook Handler must:**

1. Verify stripe signature before processing
1. Use idempotency — check if already processed
1. Update `profiles.plan` and subscription fields atomically
1. Send welcome email via Resend on upgrade
1. Send cancellation email on subscription deletion
1. Never throw — always return 200, log errors to Sentry

-----

## 9. Error Handling Convention

```typescript
// All API routes follow this pattern
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  try {
    // ... logic
    return NextResponse.json({ data })
  } catch (error) {
    Sentry.captureException(error)

    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json(
        { error: 'Usage limit reached', upgrade: true },
        { status: 429 }
      )
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Generic — don't leak internal errors
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

**Frontend error handling:**

- Show toast for transient errors (network, rate limit)
- Show inline error for validation errors
- Show modal for upgrade-required errors
- Never show raw error messages to users
- Always offer a retry action

-----

## 10. State Management

Global state lives in `src/stores/studioStore.ts` (Zustand).

```typescript
interface StudioStore {
  // Input
  content: string
  tone: Tone
  audience: Audience
  brandVoiceId: string | null
  twitterLength: 5 | 7 | 10

  // Output
  currentGeneration: Generation | null
  activeTab: FormatKey
  regenLoadingTab: FormatKey | null

  // UI
  isGenerating: boolean
  error: string | null

  // Actions
  setContent: (content: string) => void
  setTone: (tone: Tone) => void
  setAudience: (audience: Audience) => void
  generate: () => Promise<void>
  regenerate: (format: FormatKey, instruction?: string) => Promise<void>
  setActiveTab: (tab: FormatKey) => void
  clearError: () => void
}
```

**Server state** (history, brand voices, usage) uses SWR with Supabase.
**Do not put server state in Zustand.** Keep those concerns separated.

-----

## 11. Analytics Events

Track every meaningful action with Posthog:

```typescript
// Required events
posthog.capture('content_pasted', { charCount, wordCount })
posthog.capture('generation_started', { tone, audience, hasBrandVoice })
posthog.capture('generation_completed', { durationMs, tokenCount })
posthog.capture('generation_failed', { error })
posthog.capture('tab_viewed', { tab, plan })
posthog.capture('format_copied', { format })
posthog.capture('regenerate_clicked', { format, plan })
posthog.capture('upgrade_modal_opened', { trigger }) // trigger: 'limit' | 'feature' | 'header'
posthog.capture('upgrade_completed', { plan, revenue })
posthog.capture('post_published', { platform })
posthog.capture('brand_voice_saved', { sampleCount })
```

-----

## 12. Performance Requirements

- **Time to first generation result:** < 8 seconds (stream first format)
- **Tab switch:** < 50ms (all formats already in memory)
- **Page load (LCP):** < 2s on 3G
- **Bundle size:** < 200kb gzipped initial chunk

**Streaming:** The generate endpoint should stream the Claude response and
update the UI as each format completes. Do not wait for all 7 before showing
results. Use ReadableStream and Server-Sent Events.

**Streaming order:** summary → twitter → linkedin → quotes → instagram → blog → newsletter
(fastest formats first so user sees value immediately)

-----

## 13. PWA Requirements

The app must be installable on iOS and Android.

`public/manifest.json`:

```json
{
  "name": "Content Studio Pro",
  "short_name": "ContentStudio",
  "description": "Repurpose content to 7 platforms in 30 seconds",
  "start_url": "/generate",
  "display": "standalone",
  "background_color": "#060606",
  "theme_color": "#c8ff00",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Service worker must cache: app shell, fonts, last 5 generations (for offline viewing).

-----

## 14. Security Rules

1. **All AI calls go through server-side API routes.** Never call Anthropic from the browser.
1. **All Stripe calls go through server-side API routes.** Never expose Stripe secret key.
1. **Validate and sanitize all inputs server-side.** Zod schemas on every API route.
1. **Content max length: 10,000 characters.** Enforce server-side, not just UI.
1. **RLS on all Supabase tables.** Users can only access their own data.
1. **CSRF protection** on all mutating API routes via Supabase session cookies.
1. **Rate limiting** via Upstash Redis on generate and regenerate endpoints.
1. **Never log user content** to console or error tracking in production.
1. **Stripe webhook signature** verified on every incoming webhook.
1. **No .env variables with NEXT_PUBLIC_ prefix** except Supabase URL and anon key.

-----

## 15. Testing Requirements

**Unit tests** (Vitest):

- All utility functions in `src/lib/`
- Prompt builders
- Type validators

**Integration tests** (Vitest + MSW):

- API route handlers with mocked Anthropic/Stripe/Supabase
- Stripe webhook handler (all event types)
- Usage limit enforcement

**E2E tests** (Playwright):

- Full generation flow (free user)
- Upgrade flow (free → pro)
- Brand voice flow (pro user)
- Publishing flow (pro user)
- Auth flow (magic link)

**Run before every commit:**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

-----

## 16. Environment Variables

```bash
# .env.example — copy to .env.local and fill in

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Buffer
BUFFER_CLIENT_ID=
BUFFER_CLIENT_SECRET=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@contentstudio.pro

# Upstash (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

-----

## 17. Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm supabase start         # Start local Supabase
pnpm supabase db reset      # Reset local DB and run migrations

# Type generation
pnpm supabase gen types     # Regenerate database types

# Testing
pnpm test                   # Unit + integration
pnpm test:e2e               # Playwright E2E
pnpm test:coverage          # Coverage report

# Quality
pnpm typecheck              # tsc --noEmit
pnpm lint                   # ESLint
pnpm format                 # Prettier

# Build
pnpm build                  # Production build
pnpm analyze                # Bundle analyzer
```

-----

## 18. Code Style Rules

1. **Functional components only.** No class components.
1. **Named exports everywhere** except page components (Next.js requires default).
1. **Colocate types** with the file that defines them. Export from `types/` only for shared types.
1. **No `any`.** Use `unknown` and narrow properly.
1. **No magic strings** for plans, formats, tones — always use the TypeScript union types.
1. **No inline styles.** Tailwind only. Exception: dynamic values that can’t be Tailwind classes.
1. **Async/await everywhere.** No `.then()` chains.
1. **Early returns** over nested conditions.
1. **Comments explain *why*, not what.** Code should be self-documenting.
1. **Imports order:** React → third-party → internal (absolute) → relative.

-----

## 19. Deployment Checklist

Before each production deploy:

- [ ] All env variables set in Vercel
- [ ] Supabase migrations applied to production
- [ ] Stripe webhook endpoint updated if URL changed
- [ ] `pnpm build` passes locally
- [ ] `pnpm test:e2e` passes against staging
- [ ] Sentry release created
- [ ] Posthog feature flags checked

-----

## 20. Known Issues & Decisions

|Issue                                    |Decision                                                 |Rationale                                        |
|-----------------------------------------|---------------------------------------------------------|-------------------------------------------------|
|Claude sometimes returns invalid JSON    |Wrap in try/catch, retry once with explicit JSON reminder|Cheaper than structured outputs for this use case|
|Instagram carousel aspect ratio on mobile|CSS aspect-ratio with max-width clamp                    |Avoids JS layout calculation                     |
|Buffer API rate limit (10 req/min)       |Queue publishes with 6s delay between                    |Within limits, transparent to user               |
|Brand Voice prompt injection risk        |Truncate to 600 chars, strip special tokens              |Defense in depth                                 |
|Streaming + Supabase insertion           |Insert after full completion, not during stream          |Simpler, generation is < 15s                     |

-----

*Last updated: see git blame. If you find this file outdated, update it.*
