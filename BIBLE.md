# BIBLE.md — Content Studio Pro

## The Complete Product, Design & Business Reference

> This document answers every “why” question about the product.
> The CLAUDE.md answers every “how” question.
> Read both before building anything.

-----

# PART 1: PRODUCT VISION

## The One-Line Pitch

**Content Studio Pro turns one piece of content into seven platform-ready formats in 30 seconds, and it sounds exactly like you.**

## The Problem We’re Solving

Content creators, founders, and marketers know they should be on Twitter, LinkedIn, Instagram, and newsletters simultaneously. They aren’t — not because they don’t have ideas, but because repurposing content manually is soul-crushing, repetitive work that takes 2-4 hours per piece.

The existing solutions are broken in one of three ways:

1. **Too generic** — ChatGPT produces outputs that read like a robot wrote them
1. **Too expensive** — Jasper and Copy.ai charge $40–80/month for teams, not individuals
1. **Too complex** — Full content suites require learning a new system

Content Studio Pro is the third option nobody has built well: **fast, personal, affordable, and actually good**.

## The Core Insight

The thing that makes content tools sticky isn’t the generation — it’s the *voice*. The moment a user reads a LinkedIn post that sounds like *them*, they’re sold. Everything else (formats, scheduling, history) is table stakes. Brand Voice is the moat.

## Vision Statement

In 3 years, Content Studio Pro is the default tool indie founders and solo marketers use to maintain a multi-platform content presence without a content team. It sits alongside Notion and Linear as a tool that serious operators simply have open.

-----

# PART 2: USER PERSONAS

## Primary: The Indie Founder (40% of users)

**Name:** Jordan, 32
**Situation:** Building a SaaS product solo or with 1-2 co-founders. Writing a weekly newsletter. Trying to build an audience on Twitter and LinkedIn.
**Pain:** Has opinions and expertise. No time to repurpose. Posts a LinkedIn article then watches it die because they didn’t also make a Twitter thread.
**Goal:** Be known as a thought leader in their space without hiring a content person.
**Willingness to pay:** High ($12-49/month is trivial if it saves 3 hours/week)
**Key feature:** Brand Voice (they have a distinctive voice they’ve developed)

## Secondary: The Content Marketer (35% of users)

**Name:** Priya, 28
**Situation:** Works at a 10-50 person startup. Runs content solo or with one other person.
**Pain:** Has to cover 5 platforms with 2 people. Spends 60% of time reformatting.
**Goal:** Publish 5x/week across platforms without burning out.
**Willingness to pay:** Medium (needs manager approval, prefers monthly billing)
**Key feature:** Publishing integration + history (workflow efficiency)

## Tertiary: The Creator-Educator (25% of users)

**Name:** Marcus, 35
**Situation:** Creates long-form content (YouTube, podcast, courses). Wants to turn each piece into social fuel.
**Pain:** Has hours of great content locked in video/audio. Hard to extract and repurpose.
**Goal:** Get more reach from content they’ve already made.
**Willingness to pay:** Medium-high (used to paying for tools)
**Key feature:** Long transcript support, Instagram carousel

-----

# PART 3: THE PRODUCT IN DETAIL

## 3.1 The Generation Experience

### Input Phase

The input panel is the most important screen. It must feel:

- **Inviting** — large textarea, encouraging copy, no intimidating options
- **Fast** — character count live, no submit button lag
- **Smart** — options visible but not overwhelming (tone/audience default sensibly)

Default state on first visit: textarea focused, placeholder copy explains exactly what to paste.

Tone and audience selectors are pills/chips — scannable in one glance.

Brand Voice is collapsed by default (reduces cognitive load for new users).

### Generation Phase

Do not make the user stare at a spinner for 8 seconds.

Stream results in order: Summary → Twitter → LinkedIn → Quotes → Instagram → Blog → Newsletter.

As each format completes, its tab gets a green dot and becomes clickable immediately. The user can start reading/copying Twitter while Instagram is still generating. This makes the product feel fast even when it isn’t.

Show a subtle animated “generating…” state on the tabs that aren’t ready yet.

### Output Phase

Every format tab follows the same layout contract:

- Format label (top left, muted, uppercase)
- Action buttons (top right: Regenerate [Pro] + Copy All)
- Content area (full width)
- Per-item copy buttons on individual pieces where applicable

The active tab indicator uses the brand accent (#c8ff00). Inactive tabs are muted.

Never paginate output. Show everything in one scrollable panel.

## 3.2 Format Specifications

### Summary

- 2-3 sentences only
- Captures the single core idea
- Written as a standalone insight, not a “this article is about…” summary
- Used as the meta description for sharing

### Twitter/X Thread

- 7 tweets by default (configurable: 5, 7, 10)
- Tweet 1: Hook — must stand alone, no “thread 🧵” filler
- Tweets 2-6: One insight each, builds on previous
- Tweet 7: CTA or reflection — never “follow me for more”
- Each tweet numbered: 1/, 2/, etc.
- Hard limit: 280 chars per tweet (validate this in the prompt and post-process)
- No hashtags unless user explicitly uses them in their brand voice

### LinkedIn Post

- 250-350 words
- First line is the hook (no subject, punchy, makes you click “see more”)
- 3-5 paragraphs with line breaks (not walls of text)
- Concrete takeaway in paragraph 4
- CTA in final line (question or invitation to engage)
- Max 3 hashtags if any, at the very end
- No em-dash abuse. No “In today’s fast-paced world…”

### Instagram Carousel

- 7 slides (fixed)
- Slide types: hook, problem, insight, data, tip, tip, cta
- Headline: max 8 words, punchy, could work as a standalone pull quote
- Body: max 2 sentences, supports the headline
- Each slide is visually distinct (different accent color by type)
- Slide 1 (hook) must work as the cover image
- Final slide must include account handle placeholder: @[handle]

### Blog Post Outline

- 5 sections minimum
- Each section: heading + 3-4 bullet points
- Heading style: benefit-driven, not descriptive (“How to X” not “X”)
- Introduction section must include: hook angle, what reader will learn, who it’s for
- Conclusion section must include: summary of key points, next step for reader
- Suitable as a brief to give to a writer OR expand into a post directly

### Newsletter Segment

- 120-150 words
- Tone is warmer/more personal than LinkedIn
- Opens with a 1-sentence hook that references the reader’s situation
- 1 insight explained in plain language
- 1 specific action the reader can take this week
- Ends with a bridge sentence (“Next week I’ll cover…” or “Reply and tell me…”)
- No bullet points — flowing prose only

### Key Quotes

- 4 quotes
- Each is self-contained (reads well without any context)
- Mix of: provocative statement, counterintuitive insight, practical truth, aspirational framing
- 10-25 words each — tweet-friendly but deeper than a slogan
- No quotes that start with “I” (hard to reuse)
- Formatted for easy copy as visual quote posts

## 3.3 Brand Voice System

### How It Works

Users paste 2-5 samples of their best writing (tweets, blog excerpts, LinkedIn posts).
The system extracts a “voice fingerprint” — not shown to user, used internally:

- Vocabulary level (technical vs. accessible)
- Sentence length preference (short punchy vs. long complex)
- Energy level (high-energy exclamations vs. measured authority)
- Structural preferences (lists vs. prose, questions vs. statements)
- Signature phrases and patterns

This fingerprint is injected into every system prompt as a “mirror this style” instruction.

### Voice Quality Check

After generation, run a quick similarity check (Anthropic call, 100 tokens max):
“On a scale of 1-5, how closely does this output match the provided writing samples? Score only, no explanation.”
If score < 3, automatically regenerate that format once.

### Multiple Brand Voices (Agency plan)

Agency users can save up to 5 named brand voices (e.g., “My Personal Voice”, “Company Blog Voice”, “Client A”).
Select voice per generation from a dropdown.

## 3.4 History & Sessions

### What Gets Saved

Every completed generation saves:

- The original content input
- All 7 format outputs
- Tone + audience + brand voice settings used
- Timestamp
- Which formats were viewed/copied (for analytics)

### History UI

Last 10 generations shown in a collapsible sidebar.
Each entry shows: first 70 chars of input, date, tone used.
Clicking restores the full output panel — no regeneration needed.

### Export

Pro users can export any generation as:

- JSON (full structured data)
- Markdown (all formats as sections)
- Plain text (copy-paste ready)

## 3.5 Publishing via Buffer

### Connection Flow

1. User clicks “Connect Buffer” in settings
1. OAuth redirect to Buffer
1. On return, store Buffer access token in Supabase (encrypted)
1. Show connected accounts (user selects which to use)

### Publish Flow

From any format tab, “Publish” button opens a modal:

- Shows the content (editable before publishing)
- Platform selector (based on connected accounts)
- Schedule picker: Now / Today at [time] / Pick date
- Confirm button

Post-publish: Show confirmation with Buffer link to manage post.

### What Can Be Published

- Twitter: Thread (each tweet as a separate queued item) or first tweet only
- LinkedIn: Full post
- Instagram: Not supported by Buffer API for carousels — show “Copy for Instagram” instead

-----

# PART 4: DESIGN SYSTEM

## 4.1 Visual Identity

### Aesthetic Direction

**Editorial Dark + Sharp Accent**

The app lives in near-black darkness with a single aggressive accent color. The aesthetic references: Bloomberg Terminal, Linear, Vercel Dashboard. It communicates seriousness, speed, and precision. Not playful. Not friendly-corporate. *Operator-grade.*

The accent (#c8ff00, electric chartreuse) is used sparingly but decisively. It marks: active states, CTAs, the logo mark, Pro badges, and generation completion. It never decorates — it always signals something.

### Color Tokens

```
--bg-base:       #060606   /* Page background */
--bg-surface:    #0c0c0c   /* Cards, panels */
--bg-elevated:   #141414   /* Hover states, header bars */
--bg-input:      #0e0e0e   /* Text inputs, textareas */

--border-subtle: #111111   /* Barely visible structure */
--border-default:#1a1a1a   /* Cards, dividers */
--border-hover:  #2a2a2a   /* Hover on interactive elements */

--text-primary:  #e8e8e8   /* Main content */
--text-secondary:#888888   /* Labels, metadata */
--text-muted:    #444444   /* Disabled, placeholders */
--text-ghost:    #242424   /* Ultra-subtle hints */

--accent:        #c8ff00   /* Primary accent — use sparingly */
--accent-dim:    #c8ff0022 /* Accent backgrounds */
--accent-border: #c8ff0044 /* Accent borders */

--success:       #4ade80
--error:         #ff7070
--warning:       #fb923c
--info:          #60b4ff
```

### Typography

**Display / Headings:** Syne (Google Fonts)

- Weight 800 for hero text
- Weight 700 for section headings
- Letter spacing: -0.8px to -1.5px (tight)

**Body / UI:** DM Sans (Google Fonts)

- Weight 400 for body text
- Weight 500 for labels
- Weight 600 for button text
- Letter spacing: normal

**Monospace (code, IDs):** JetBrains Mono

- Only used where truly needed

**Never use:** Inter, Roboto, system-ui, Arial, Helvetica

### Spacing Scale

Use Tailwind’s default spacing scale (4px base unit).
Most used: 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px)

## 4.2 Component Patterns

### Buttons

```
Primary CTA:    bg-[#c8ff00] text-black font-bold — used ONCE per view
Secondary:      bg-[#141414] border border-[#2a2a2a] text-[#888]
Ghost:          no background, border on hover only
Danger:         bg-[#140808] border border-[#2a1010] text-[#ff7070]
```

All buttons: rounded-[10px], transition-all duration-200, font-family Syne for CTAs

### Input Fields

```
background: #0e0e0e
border: 1px solid #181818
border-radius: 12px (large inputs) / 8px (small)
focus: border-color: #c8ff00 (no box-shadow)
placeholder: color #2e2e2e
```

### Cards / Panels

```
background: #0c0c0c
border: 1px solid #1a1a1a
border-radius: 14px (feature cards) / 10px (list items) / 8px (tags)
```

### Tags / Pills

```
Active:   bg-[#c8ff00] text-black border-[#c8ff00]
Inactive: bg-[#101010] text-[#555] border-[#1e1e1e]
Hover:    border-[#2a2a2a] text-[#888]
```

### Copy Button

Small, unobtrusive. Lives top-right of any copiable block.
Shows ⎘ icon + “Copy” → ✓ + “Copied” for 1.8 seconds.
Never uses a toast for this — the inline state change is sufficient.

### Regenerate Button

Pro-only. Lives next to Copy button.
Shows ↻ icon (spinning when active) + “Regenerate”.
Disabled (muted) when: not Pro, another regeneration in progress.

## 4.3 Motion & Animation

**Philosophy:** Motion should feel earned. One great animation beats ten subtle ones.

**Page transitions:** Fade + translateY(8px) → 0 over 300ms.
**Tab switches:** Immediate (< 50ms) — no animation, data is already in memory.
**Generation progress:** Tabs get a green dot with a scale-in animation as they complete.
**Streaming text:** Text appears character-by-character using CSS animation, not JS typing effect.
**Modals:** Scale from 0.96 to 1.0 + fade in over 200ms.
**Loading spinner:** CSS rotation only, no library.
**Hover states:** 150ms transitions on border-color and background.

**Never animate:** Layout shifts, list reorders, page scrolling.

## 4.4 Responsive Behavior

**Desktop (1200px+):** Two-column layout. Input left, output right.
**Tablet (768-1200px):** Stacked layout. Input top, output below. Tabs scroll horizontally.
**Mobile (< 768px):** Single column. Bottom tab bar replaces sidebar tabs. Floating “Generate” button pinned to bottom.

The app must be fully usable on mobile. The Instagram carousel is *especially* important on mobile — this is where users will actually preview it.

-----

# PART 5: BUSINESS MODEL

## 5.1 Pricing Strategy

### Free Tier

**3 generations per day** (resets at midnight UTC)
Formats: Summary, Twitter, LinkedIn, Blog, Newsletter, Quotes
No Instagram Carousel
No Brand Voice
No publishing
No history (current session only)

*Goal: Create “wow” moments. Three is enough to demonstrate value without enabling unlimited freeloading.*

### Pro — $12/month

All 7 formats including Instagram Carousel
Brand Voice (1 voice)
Per-format Regeneration
Buffer publishing integration
Last 10 generations history
100 generations per day
Export (JSON, Markdown, plain text)

*$12 is priced below a Spotify subscription. It’s “don’t-think-about-it” money for anyone this tool saves 2+ hours/week.*

### Agency — $49/month

Everything in Pro
5 Brand Voices
Unlimited generations
API access (bring your own integrations)
White-label option (remove Content Studio branding)
Priority support (< 4h response)
Team members: up to 3 seats

*Agencies charging clients $500+/month for content management will pay $49 trivially.*

### Annual Discount

Pro: $99/year (save $45 — 31% off)
Agency: $399/year (save $189 — 32% off)

## 5.2 Unit Economics

**Pro user:**

- Revenue: $12/month
- COGS (API): ~$0.40-1.20/month (assumes 20-60 generations, avg 3000 tokens each at $3/MTok)
- Gross margin: ~90% at normal usage
- **Risk:** Power users (100 gen/day) cost ~$6/month in API → unprofitable
- **Mitigation:** Soft throttle at 50/day, hard limit at 100/day. Message heavy users about Agency tier.

**Agency user:**

- Revenue: $49/month
- COGS (API): ~$2-8/month (assumes unlimited but typical is ~200 gen/month)
- Gross margin: ~85-90%

**Break-even:** 40 Pro users covers Vercel + Supabase + tooling costs. 100 Pro users = profitable.

## 5.3 Growth Strategy

### Phase 1: Validation (Month 1-2)

**Goal:** 50 paying users
**Tactics:**

- Product Hunt launch (plan for a Tuesday)
- Post the “30-second demo video” on Twitter/LinkedIn personally
- DM 100 indie founders in the target ICP
- Submit to relevant newsletters: TLDR, Indie Hackers, etc.
- Offer founding member pricing: $8/month locked forever for first 50

**Success metric:** 5 strangers pay without being asked twice.

### Phase 2: Growth (Month 3-6)

**Goal:** 500 paying users, $6K MRR
**Tactics:**

- AppSumo lifetime deal ($79 one-time, target 200 deals = $15K upfront)
- SEO: Target “content repurposing tool”, “twitter thread generator”, “linkedin post generator”
- Build in public on Twitter — share revenue milestones
- Affiliate program: 30% recurring for referrals
- Cold email 500 marketing agencies with personalized demo

**Success metric:** 20% of free signups convert to paid within 14 days.

### Phase 3: Scale (Month 7-12)

**Goal:** $20K MRR
**Tactics:**

- YouTube channel: “How I repurposed my [X] into 7 pieces of content”
- Partner integrations: Notion, Beehiiv, Ghost
- API access (Agency tier) → B2B SaaS integrations
- Consider niche versions: Real estate agent variant, SaaS founder variant

## 5.4 Churn Reduction

**Biggest churn risks:**

1. User generates once, forgets to come back → fix with email sequences + weekly digest
1. Output quality doesn’t match expectations → fix with better Brand Voice onboarding
1. Finds ChatGPT “good enough” → fix by making the voice matching undeniably better

**Retention tactics:**

- Day 1 email: Tips for getting best results + Brand Voice setup guide
- Day 7 email: “You generated X posts this week — here’s what performed best” (if Buffer connected)
- Day 30 email: “This month’s content stats” — show outputs generated, formats used
- Monthly digest: “Top performing content formats this month across our community”
- In-app: Weekly usage summary shown on dashboard

-----

# PART 6: TECHNICAL ROADMAP

## 6.1 MVP (Weeks 1-4)

The minimum that can be charged for:

- [ ] Auth (Supabase magic link)
- [ ] Generate endpoint with streaming
- [ ] All 7 formats rendering correctly
- [ ] Tone + Audience controls
- [ ] Copy buttons on all formats
- [ ] Usage tracking (free limit enforcement)
- [ ] Stripe Checkout (Pro only to start)
- [ ] Stripe webhook (activate Pro on payment)
- [ ] Basic history (last 10 in DB)
- [ ] Deployed to Vercel

**Not in MVP:** Brand Voice, Buffer, Instagram carousel editing, Agency tier, export

## 6.2 V1.0 (Weeks 5-8)

The version worth promoting:

- [ ] Brand Voice (Pro)
- [ ] Per-format Regenerate (Pro)
- [ ] Instagram Carousel preview
- [ ] Buffer OAuth + publish flow (Pro)
- [ ] Generation export (Pro)
- [ ] PWA manifest + service worker
- [ ] Posthog analytics
- [ ] Sentry error tracking
- [ ] Agency tier + 5 brand voices
- [ ] Onboarding flow (first-time user tour)
- [ ] Email sequences via Resend

## 6.3 V1.5 (Weeks 9-14)

Retention and differentiation:

- [ ] Twitter/X OAuth (publish threads natively, not just via Buffer)
- [ ] LinkedIn OAuth (publish directly)
- [ ] Content calendar view (week view of scheduled posts)
- [ ] Regeneration with instruction (“make it funnier”, “shorter”, “add a stat”)
- [ ] Template library (community-shared prompt styles)
- [ ] Notion integration (send blog outline directly to Notion)
- [ ] Beehiiv integration (send newsletter directly to Beehiiv)
- [ ] API access (Agency — documented REST API)

## 6.4 V2.0 (Month 4+)

Defensibility features:

- [ ] Voice learning over time (analyzes all previous user outputs, improves matching automatically)
- [ ] Performance analytics (connect Twitter/LinkedIn analytics to see which formats perform)
- [ ] A/B format testing (generate 2 versions of LinkedIn, pick winner)
- [ ] Team workspaces (multi-seat Agency)
- [ ] Custom format builder (users define their own 8th format)
- [ ] Zapier/Make integration
- [ ] Chrome extension (highlight text on any page → repurpose)

-----

# PART 7: QUALITY STANDARDS

## What “Good” Looks Like For Each Format

### Twitter Thread — Pass/Fail Criteria

✅ Tweet 1 can stand alone and be retweeted without context
✅ Each tweet advances the narrative — no filler
✅ Thread has a clear beginning, middle, end
✅ Tweets 2-6 are all under 280 chars
✅ No cringe endings (“That’s a wrap! Follow for more 🙏”)
❌ Fail: Any tweet over 280 chars
❌ Fail: Thread starts with “Today I want to share…”
❌ Fail: Hashtags on every tweet

### LinkedIn Post — Pass/Fail Criteria

✅ First line makes you want to click “see more”
✅ Has at least one concrete, specific insight (not “it’s important to…”)
✅ Ends with something that invites engagement (question, challenge, offer)
✅ Reads like a human wrote it, not a template
❌ Fail: Starts with “In today’s fast-paced world”
❌ Fail: Uses 10+ hashtags
❌ Fail: Every paragraph is one sentence
❌ Fail: Contains “I’m excited to share” or “game-changer”

### Instagram Carousel — Pass/Fail Criteria

✅ Slide 1 headline works as a cover (intriguing, benefit-driven)
✅ Each slide has visual contrast from the previous
✅ The narrative arc is: problem → insight → solution → action
✅ Slide 7 has a clear CTA
❌ Fail: Any headline over 8 words
❌ Fail: Body text over 2 sentences per slide
❌ Fail: Slides feel repetitive

### Blog Outline — Pass/Fail Criteria

✅ Could be handed to a writer with no briefing
✅ Section headings are benefit-driven
✅ Introduction section has a clear hook angle
✅ Each section has 3+ distinct points
❌ Fail: Sections that are just “Introduction”, “Body”, “Conclusion” with no specifics
❌ Fail: Points that repeat across sections

-----

# PART 8: LAUNCH CHECKLIST

## Pre-Launch (Week Before)

- [ ] Smoke test all paid flows on production
- [ ] Test Stripe webhooks end-to-end
- [ ] Set up status page (statuspage.io free tier)
- [ ] Write and schedule “building in public” Twitter thread
- [ ] Prepare Product Hunt assets (logo, screenshots, video, description)
- [ ] Seed 5 friend/beta accounts to leave PH comments
- [ ] Set up [email protected] as real inbox
- [ ] Configure Sentry alerts for error spikes
- [ ] Load test generate endpoint (50 concurrent)
- [ ] Prepare 3 demo videos: 30s, 2min, 5min

## Launch Day (Product Hunt)

- [ ] Submit at 12:01am PST
- [ ] Post across personal Twitter + LinkedIn
- [ ] Message 50 personal contacts to upvote
- [ ] Post in relevant Slack/Discord communities
- [ ] Respond to every comment within 30 minutes
- [ ] Update “launch day” banner in app
- [ ] Watch Sentry + Supabase dashboards all day

## Post-Launch (Week After)

- [ ] Write “Launch retrospective” post (transparency builds audience)
- [ ] Email everyone who signed up on launch day
- [ ] Analyze drop-off points in generation flow
- [ ] Fix top 3 issues reported
- [ ] Start weekly “building in public” updates

-----

# PART 9: COMPETITIVE LANDSCAPE

|Tool        |Price    |Strength             |Weakness              |Our edge              |
|------------|---------|---------------------|----------------------|----------------------|
|ChatGPT     |$20/mo   |Flexible             |No memory, no workflow|Brand Voice + workflow|
|Jasper      |$39/mo   |Established          |Complex, expensive    |3x cheaper, faster    |
|Copy.ai     |$36/mo   |Templates            |Generic output        |Voice matching        |
|Taplio      |$49/mo   |LinkedIn-specific    |LinkedIn only         |7 platforms           |
|Typefully   |$12.50/mo|Twitter-specific     |Twitter only          |7 platforms           |
|Repurpose.io|$25/mo   |Auto-repurpose       |No quality control    |Better output quality |
|Buffer (AI) |$18/mo   |Integrated publishing|Weak AI               |Better content quality|

**Positioning:** We are the only tool that combines multi-format generation + brand voice matching + direct publishing at under $15/month. We are not trying to be Jasper. We are trying to be the tool that replaces the Friday afternoon content repurposing session.

-----

# PART 10: DECISIONS LOG

*Document every significant product/technical decision here so future contributors understand the reasoning.*

|Date |Decision                                     |Reason                                                                 |Alternatives Considered                                |
|-----|---------------------------------------------|-----------------------------------------------------------------------|-------------------------------------------------------|
|Day 1|Use Anthropic API not OpenAI                 |Better instruction following for structured JSON output                |OpenAI gpt-4o                                          |
|Day 1|7 formats not 10                             |Fewer, better > more, mediocre                                         |Was going to include YouTube description, TikTok script|
|Day 1|Supabase not Firebase                        |SQL + RLS is more maintainable at scale                                |Firebase, PlanetScale                                  |
|Day 1|$12/mo Pro not $19/mo                        |Below “do I need to think about this” threshold                        |$15, $19, $29                                          |
|Day 2|Stream formats individually                  |Users see value in <3 seconds vs waiting 8+ seconds                    |Batch all formats                                      |
|Day 2|Buffer not direct API                        |Twitter/LinkedIn APIs have posting restrictions + cost                 |Direct OAuth APIs                                      |
|Day 3|3 free/day not 3 free total                  |Daily reset creates return habit. Total limit creates resentment.      |Lifetime limit, weekly limit                           |
|Day 3|Brand Voice as text samples not questionnaire|Samples produce better results. Questionnaire produces generic prompts.|Style questionnaire                                    |

-----

*This document is a living record. Update it when the product changes. Delete sections that become irrelevant. Add sections as new domains emerge. The goal is that any new contributor can read this in 30 minutes and build something that fits.*
