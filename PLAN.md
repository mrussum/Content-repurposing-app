# Content Studio Pro — Implementation Plan

## Phase 0: Project Bootstrap

Before any feature work:

1. **Initialize Next.js 14** with App Router, TypeScript, Tailwind, `src/` dir
2. **Install deps:** `@supabase/ssr`, `@anthropic-ai/sdk`, `stripe`, `zustand`, `swr`, `zod`, `@upstash/ratelimit`, `@upstash/redis`
3. **shadcn/ui init** — dark theme, CSS variables; add: button, textarea, tabs, dialog, toast, select, badge, scroll-area, tooltip
4. **Design system** — `globals.css` with all CSS tokens from BIBLE.md §4.1; extend `tailwind.config.ts` with token references; import Google Fonts: Syne, DM Sans, JetBrains Mono
5. **Supabase schema** — `supabase/migrations/001_initial_schema.sql` creating all 4 tables in order (profiles → brand_voices → generations → published_posts), each with RLS policies immediately; `handle_new_user()` trigger to auto-create profile on signup
6. **`.env.example`** — all variables from CLAUDE.md §16
7. **Error classes** — `src/lib/errors.ts`: `AuthError`, `UsageLimitError`, `ValidationError`, `PlanRequiredError`
8. **Vitest config** — `vitest.config.ts` with jsdom, path aliases

---

## Phase 1: MVP (Weeks 1–4)

**Goal:** Working product that can be charged for.

### Dependency order
Types → Supabase clients → Auth → Middleware → Anthropic lib + Rate limit + Stripe lib → API routes → Zustand store → Hooks → Components → Pages

### 1.1 Types (`src/types/`)
- `generation.ts` — all types from CLAUDE.md §6 verbatim (`Tone`, `Audience`, `FormatKey`, `GenerationResult`, `UsageInfo`, etc.)
- `billing.ts` — `Plan`, `SubscriptionStatus`
- `database.ts` — hand-authored from schema, later regenerated via `pnpm supabase gen types`

### 1.2 Supabase Clients
- `src/lib/supabase/client.ts` — browser client via `createBrowserClient`
- `src/lib/supabase/server.ts` — server client via `createServerClient` + cookies
- `src/lib/supabase/middleware.ts` — `updateSession` helper
- `src/middleware.ts` — refresh session + redirect unauthenticated users from `/(app)/` to `/login`

### 1.3 Auth
- `src/app/(auth)/login/page.tsx` — magic link + Google OAuth, full-screen centered card
- `src/app/(auth)/callback/route.ts` — exchange code for session, redirect to `/generate`

### 1.4 Layout
- `src/app/layout.tsx` — root layout, fonts, Sentry boundary, Posthog provider
- `src/app/(app)/layout.tsx` — app shell with auth check, renders Header + Sidebar
- `src/components/layout/Header.tsx` — logo, UsageMeter, user menu
- `src/components/layout/Sidebar.tsx` — nav links; bottom tab bar on mobile

### 1.5 Anthropic Integration
- `src/lib/anthropic/client.ts` — singleton `Anthropic` instance
- `src/lib/anthropic/prompts.ts` — **highest-leverage file**; `buildSystemPrompt()`, `buildUserPrompt()`, `buildRegeneratePrompt()`, `buildBrandVoiceAnalysisPrompt()`; JSON output schema embedded verbatim matching `GenerationResult` key names exactly
- `src/lib/anthropic/generate.ts` — `generateContent()`, `parseGenerationResult()` (with retry on invalid JSON), `estimateTokens()`; `max_tokens: 3000` always set explicitly

**Streaming approach:** Buffer full Claude response server-side, parse once, emit SSE status events during generation, emit complete result at end. Avoids partial-JSON parsing fragility.

### 1.6 Rate Limiting (`src/lib/ratelimit.ts`)
- Upstash sliding window: Free=3/24h, Pro=100/24h, keyed by `user_id`
- Redis enforces limit; Postgres `profiles.generations_used` tracks display count — two separate concerns

### 1.7 Stripe (`src/lib/stripe/`)
- `client.ts` — singleton `Stripe` instance (server-only)
- `plans.ts` — `PLANS` const from CLAUDE.md §8 + helpers: `getPlanLimit()`, `isFeatureAvailable()`, `getPriceId()`

### 1.8 API Routes
- `src/app/api/generate/route.ts` — Zod validation → auth → rate limit → plan check → token estimate → stream Claude → insert DB → increment usage; SSE format: `{type:'status'}` events then `{type:'complete', id, result, usage}`
- `src/app/api/usage/route.ts` — GET, returns `UsageInfo` from `profiles`
- `src/app/api/billing/checkout/route.ts` — creates Stripe Checkout Session
- `src/app/api/webhooks/stripe/route.ts` — verify signature via `req.text()` (not `req.json()`!); handle 4 events; always return 200; log errors to Sentry

### 1.9 State & Hooks
- `src/stores/studioStore.ts` — Zustand store per CLAUDE.md §10; `generate` action parses SSE stream via `fetch` + `ReadableStream`
- `src/hooks/useGenerate.ts` — thin wrapper over store
- `src/hooks/useUsage.ts` — SWR, 30s refresh, fetches `/api/usage`
- `src/hooks/useHistory.ts` — SWR, queries Supabase directly (RLS handles auth)

### 1.10 Core UI Components
- `src/components/studio/GeneratePanel.tsx` — textarea + char count, tone/audience pills, twitter length selector, Generate CTA
- `src/components/studio/OutputPanel.tsx` — tab bar + content area, skeleton while generating
- `src/components/studio/FormatTab.tsx` — pulse dot (generating), green dot (ready), accent border (active), lock icon (Free)
- `src/components/billing/UsageMeter.tsx` — progress bar, upgrade nudge at >66%
- `src/components/billing/UpgradeModal.tsx` — plan comparison, Stripe Checkout redirect

### 1.11 Pages
- `src/app/(app)/generate/page.tsx` — `grid grid-cols-[420px_1fr]` desktop, `flex flex-col` mobile
- `src/app/(app)/history/page.tsx` — last 10 generations list, restore button; Free users see upgrade prompt

### 1.12 Deploy
- Set all env vars in Vercel
- Register Stripe webhook endpoint in Stripe dashboard
- Run `supabase db push` for production migrations

---

## Phase 2: V1.0 (Weeks 5–8)

**Goal:** Version worth promoting publicly.

### 2.1 Brand Voice
- Migration: no new columns needed (table exists)
- `src/app/api/brand-voice/route.ts` — POST/PUT/DELETE; enforces 1-voice limit (Pro), 5-voice limit (Agency)
- `src/lib/anthropic/generate.ts` — add `analyzeBrandVoice(samples)`; `max_tokens: 400`
- `src/hooks/useBrandVoice.ts` — SWR over Supabase direct
- `src/app/(app)/brand-voice/page.tsx` + `src/components/studio/BrandVoiceEditor.tsx`
- Inject voice summary into `buildSystemPrompt()` — truncate samples to 600 chars, strip special tokens (`<|`, `|>`, `###`, `INST`)

### 2.2 Per-Format Regeneration
- `src/app/api/regenerate/route.ts` — Pro-only; fetch original generation, call Claude at `max_tokens: 800`, update `generations.result` via `jsonb_set()`
- Update `OutputPanel.tsx` — add Regenerate button + optional instruction input with pre-built chips

### 2.3 Instagram Carousel
- `src/components/studio/InstagramCarousel.tsx` — 7 slides, type-based colors, CSS `scroll-snap` navigation, `aspect-ratio: 1/1` with `max-width: clamp(280px, 100%, 500px)`

### 2.4 Buffer Integration
- Migration: add `buffer_access_token` to `profiles`
- `src/lib/buffer/client.ts` — `getProfiles()`, `createPost()` with 6s inter-post delay
- `src/app/api/buffer/oauth/route.ts` + `/callback/route.ts`
- `src/app/api/publish/route.ts` — Pro-only; fetch token via service role, call Buffer, insert `published_posts`
- `src/components/studio/PublishModal.tsx` — editable content, platform selector, schedule picker

### 2.5 Export
- `src/app/api/export/route.ts` — GET `?id=&format=json|markdown|text`; Pro-only; sets `Content-Disposition` for download

### 2.6 Onboarding
- Migration: add `has_onboarded boolean default false` to `profiles`
- `src/app/(app)/onboarding/page.tsx` — 3 steps: welcome, brand voice setup, first generation CTA
- Update `src/middleware.ts` — redirect new users to `/onboarding`

### 2.7 Observability
- **Sentry:** `npx @sentry/wizard -i nextjs`; `tracesSampleRate: 0.1` in prod
- **Posthog:** `src/components/providers/PosthogProvider.tsx`; `autocapture: false`; all events from CLAUDE.md §11 at their trigger points

### 2.8 Email (Resend)
- `src/lib/resend/client.ts` — `sendWelcomeEmail()`, `sendCancellationEmail()`
- Triggered from Stripe webhook handler

### 2.9 PWA
- `public/manifest.json` — exact JSON from CLAUDE.md §13
- `public/sw.js` — cache-first for app shell + fonts; no HTML caching (Next.js streaming incompatible); last 5 generations in IndexedDB
- Register SW in `layout.tsx` `useEffect`
- Add manifest metadata to `layout.tsx` metadata export

### 2.10 Agency Tier
- Wire up Agency `stripePriceId` in `plans.ts`
- Skip Upstash check for Agency users in generate route
- Brand voice page shows 5 slots for Agency

---

## Phase 3: V1.5 (Weeks 9–14)

**Goal:** Retention and ecosystem integrations.

### 3.1 Direct Platform OAuth (Twitter + LinkedIn)
- OAuth 2.0 PKCE routes for Twitter; Share API OAuth for LinkedIn
- Migration: add `twitter_access_token`, `linkedin_access_token` columns
- `src/app/api/publish/twitter/route.ts` + `linkedin/route.ts`
- `PublishModal` gains "Direct" tab alongside "Via Buffer"

### 3.2 Content Calendar
- `src/app/(app)/calendar/page.tsx` — reads `published_posts WHERE status='scheduled'`
- `src/components/calendar/CalendarWeek.tsx` — 7-column CSS grid, click to edit/reschedule

### 3.3 Regeneration with Instructions (UI Polish)
- Replace simple Regenerate button with dropdown + pre-built instruction chips ("Make it shorter", "Make it funnier", "More formal", "Add a statistic")

### 3.4 Notion Integration
- `src/app/api/integrations/notion/route.ts` — OAuth flow
- `src/app/api/integrations/notion/export/route.ts` — blog outline → Notion page blocks

### 3.5 Vercel Cron (Email Sequences)
- `src/app/api/cron/daily-digest/route.ts` — protected by `CRON_SECRET` header
- `vercel.json` cron: `0 9 * * *`

### 3.6 Agency API Access
- Migration: `api_keys` table (`id`, `user_id`, `key_hash`, `name`, `last_used_at`)
- `src/app/api/v1/generate/route.ts` — public API, authenticated by `csp_` prefixed key
- `src/app/api/v1/keys/route.ts` — CRUD; store SHA-256 hash only
- `src/app/(app)/settings/api/page.tsx` — Agency-gated key management UI

### 3.7 Template Library
- Migration: `templates` table (`id`, `name`, `description`, `system_prompt_addon`, `is_public`, `use_count`)
- `src/app/(app)/templates/page.tsx` + `src/app/api/templates/route.ts`

---

## Key Gotchas

| Area | Gotcha |
|------|--------|
| Stripe webhook | Use `req.text()` not `req.json()` — body must stay raw for signature verification |
| Supabase SSR | Must use `createServerClient` with cookie adapter in middleware — not standard `createClient` |
| New user signup | `handle_new_user()` trigger must exist or profiles table has no row and all RLS queries return empty |
| Prompt JSON keys | `blogOutline` in prompt must match `GenerationResult.blogOutline` exactly — camelCase, not snake_case |
| Token limits | Set `max_tokens` explicitly on every Anthropic call — never omit |
| Brand voice injection | Truncate samples to 600 chars and strip special tokens before injecting into prompts |
| Upstash | Use `@upstash/redis` not `ioredis` — must be edge-compatible for Vercel |
| Instagram carousel | Use CSS `scroll-snap`, not a JS library |

---

## Critical Files (Highest Leverage)

1. `src/lib/anthropic/prompts.ts` — output quality of the entire product depends on this
2. `src/app/api/generate/route.ts` — streaming, rate limiting, and DB writes all converge here
3. `src/lib/supabase/middleware.ts` — auth security foundation; everything breaks if wrong
4. `supabase/migrations/001_initial_schema.sql` — RLS must be correct from day one
