# Content Studio Pro — Complete Setup Guide

**Who this is for:** Anyone who wants to run Content Studio Pro, even if you have never deployed a web app before. Follow every step in order and you will have a live, working app.

**What you are building:** A SaaS web application that turns one piece of content into 7 platform-ready formats (Twitter threads, LinkedIn posts, Instagram carousels, blog outlines, newsletters, summaries, and quotes) using AI.

**Time to complete:** 60–90 minutes on your first attempt.

---

## What You Will Need (Accounts to Create)

You need free (or trial) accounts on these services. Create them all before starting — each one gives you credentials (keys) that you will paste into your app later.

| Service | What it does | Cost to start |
|---|---|---|
| GitHub | Stores your code | Free |
| Vercel | Hosts your website | Free |
| Supabase | Database and user logins | Free |
| Anthropic | The AI that generates your content | Pay-per-use (starts at ~$0.003 per generation) |
| Stripe | Handles payments and subscriptions | Free until you earn money |
| Resend | Sends emails to users | Free up to 3,000 emails/month |
| Upstash | Prevents abuse (rate limiting) | Free |
| Posthog | Analytics (optional) | Free |
| Buffer | Social media scheduling (optional) | Free tier available |
| Twitter Developer | Direct Twitter posting (optional) | Free |
| LinkedIn Developer | Direct LinkedIn posting (optional) | Free |
| Notion Developer | Notion export (optional) | Free |

The optional ones can be skipped on your first deployment. The app works without them — those features simply will not appear.

---

## Part 1 — Get the Code onto GitHub

### Step 1.1 — Create a GitHub account

1. Go to **github.com**
2. Click **Sign up** and create a free account
3. Verify your email address

### Step 1.2 — Fork this repository

> "Forking" means making your own personal copy of the code.

1. Go to the GitHub page for this project
2. Click the **Fork** button near the top-right of the page
3. Leave all settings as default and click **Create fork**
4. You now have your own copy at `github.com/YOUR-USERNAME/content-repurposing-app`

---

## Part 2 — Set Up Supabase (Database + Auth)

Supabase is a free database service. It stores your users, their content history, and their subscription status.

### Step 2.1 — Create a Supabase account and project

1. Go to **supabase.com** and click **Start your project**
2. Sign in with your GitHub account
3. Click **New project**
4. Fill in:
   - **Name:** `content-studio-pro` (or anything you like)
   - **Database Password:** Create a strong password and **save it somewhere safe** (you will need it if you ever connect directly to the database)
   - **Region:** Choose the one closest to where most of your users will be
5. Click **Create new project** and wait about 2 minutes for it to set up

### Step 2.2 — Get your Supabase credentials

1. In your Supabase project, click **Project Settings** (gear icon in the left sidebar)
2. Click **API** in the settings menu
3. You will see three values — copy each one and save them in a text document:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key (under "Project API keys") → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (scroll down, click "Reveal") → this is your `SUPABASE_SERVICE_ROLE_KEY`

> **Important:** Keep the `service_role` key private. It has admin access to your database. Never share it publicly.

### Step 2.3 — Run the database migrations

Migrations are SQL scripts that create your database tables. You need to run two of them.

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**

**Run migration 1:**
3. Open the file `supabase/migrations/001_initial_schema.sql` from your repository on GitHub
4. Copy the entire contents of that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
7. You should see "Success. No rows returned" — this means it worked

**Run migration 2:**
8. Click **New query** again to open a fresh editor
9. Open the file `supabase/migrations/002_phase3.sql` from your repository on GitHub
10. Copy the entire contents and paste it into the SQL Editor
11. Click **Run**
12. You should see "Success. No rows returned" again

**Verify it worked:**
13. Click **Table Editor** in the left sidebar
14. You should see tables listed: `profiles`, `generations`, `brand_voices`, `published_posts`, `templates`, `api_keys`

### Step 2.4 — Enable Email Auth

1. In Supabase, click **Authentication** in the left sidebar
2. Click **Providers**
3. Make sure **Email** is enabled (it should be on by default)
4. Under **Email**, enable **Magic Link** (passwordless login by email)
5. Click **Save**

---

## Part 3 — Set Up Anthropic (AI)

Anthropic's Claude AI is what actually generates all your content. You pay a small amount per generation (roughly $0.003–0.01 per use depending on content length).

### Step 3.1 — Create an Anthropic account

1. Go to **console.anthropic.com**
2. Click **Sign up** and create an account
3. Verify your email and add a credit card (required to use the API)
4. Anthropic gives new accounts some free credits to start

### Step 3.2 — Create an API key

1. In the Anthropic console, click **API Keys** in the left sidebar
2. Click **Create Key**
3. Give it a name like `content-studio-production`
4. Copy the key that appears — it starts with `sk-ant-`
5. **Save it immediately.** You will never be able to see it again after closing that dialog.
6. This is your `ANTHROPIC_API_KEY`

---

## Part 4 — Set Up Stripe (Payments)

Stripe handles subscription billing. Even if you want to test the app first without real payments, you still need a Stripe account so the webhook endpoint exists.

### Step 4.1 — Create a Stripe account

1. Go to **stripe.com** and click **Start now**
2. Create an account with your email
3. Verify your email address
4. You will start in **Test mode** — this is safe to use during setup

### Step 4.2 — Get your API keys

1. In the Stripe dashboard, click **Developers** in the top navigation
2. Click **API keys**
3. Copy both keys and save them:
   - **Publishable key** (starts with `pk_test_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (click "Reveal test key", starts with `sk_test_`) → `STRIPE_SECRET_KEY`

### Step 4.3 — Create your subscription products

You need to create two subscription plans: Pro ($12/month) and Agency ($49/month).

**Create the Pro plan:**
1. In Stripe, click **Products** in the left sidebar
2. Click **Add product**
3. Fill in:
   - **Name:** `Pro`
   - **Description:** `100 generations/day, brand voice, publishing`
4. Under **Pricing**, select:
   - **Recurring**
   - **Price:** $12.00
   - **Billing period:** Monthly
5. Click **Save product**
6. On the product page, find the **Price ID** — it starts with `price_` — copy it → this is your `STRIPE_PRO_PRICE_ID`

**Create the Agency plan:**
7. Click **Add product** again
8. Fill in:
   - **Name:** `Agency`
   - **Description:** `Unlimited generations, 5 brand voices, API access`
9. Under **Pricing**:
   - **Recurring**
   - **Price:** $49.00
   - **Billing period:** Monthly
10. Click **Save product**
11. Copy the **Price ID** → this is your `STRIPE_AGENCY_PRICE_ID`

### Step 4.4 — Set up the webhook (do this AFTER deploying to Vercel in Part 7)

> Skip this step for now. Come back to it after you have your Vercel URL.

---

## Part 5 — Set Up Resend (Email)

Resend sends welcome emails, daily digests, and other notifications to your users.

### Step 5.1 — Create a Resend account

1. Go to **resend.com** and click **Get started**
2. Create a free account
3. Verify your email

### Step 5.2 — Get your API key

1. In the Resend dashboard, click **API Keys** in the left sidebar
2. Click **Create API Key**
3. Give it a name like `content-studio-production`
4. Click **Add** and copy the key → this is your `RESEND_API_KEY`

### Step 5.3 — Add your sending domain (optional but recommended)

By default, Resend lets you send from `onboarding@resend.dev` for testing. To use your own domain (like `hello@yourdomain.com`):

1. Click **Domains** in the Resend sidebar
2. Click **Add Domain** and follow the DNS verification steps
3. Once verified, update the `RESEND_FROM_EMAIL` variable to use your domain

For now, you can leave `RESEND_FROM_EMAIL` as `hello@contentstudio.pro` and it will use Resend's test sender during development.

---

## Part 6 — Set Up Upstash (Rate Limiting)

Upstash is a serverless Redis database used to prevent users from abusing the API. The free tier is generous enough for most small apps.

### Step 6.1 — Create an Upstash account

1. Go to **upstash.com** and click **Get started**
2. Sign in with your GitHub account

### Step 6.2 — Create a Redis database

1. Click **Create database**
2. Fill in:
   - **Name:** `content-studio-ratelimit`
   - **Type:** Regional
   - **Region:** Choose the same region you chose for Supabase
3. Click **Create**

### Step 6.3 — Get your credentials

1. On the database page, scroll down to **REST API**
2. Copy both values:
   - **UPSTASH_REDIS_REST_URL** → starts with `https://`
   - **UPSTASH_REDIS_REST_TOKEN** → a long string of letters and numbers

---

## Part 7 — Deploy to Vercel

Vercel hosts your website and makes it available on the internet.

### Step 7.1 — Create a Vercel account

1. Go to **vercel.com** and click **Sign Up**
2. Sign in with your GitHub account — this connects them so Vercel can access your code

### Step 7.2 — Import your project

1. In the Vercel dashboard, click **Add New** → **Project**
2. Find your forked repository in the list (`content-repurposing-app`) and click **Import**
3. On the configuration screen:
   - **Framework Preset:** Vercel should automatically detect **Next.js**
   - **Root Directory:** Leave as `./` (default)
   - **Build Command:** Leave as default (`pnpm build` or `next build`)

### Step 7.3 — Add your environment variables

This is the most important step. You need to add every key you collected in Parts 2–6.

1. Expand the **Environment Variables** section on the Vercel import screen
2. Add each variable one by one. The **Name** goes in the left box, the **Value** goes in the right box.

Add these variables (replace the placeholder values with your real ones):

```
NEXT_PUBLIC_SUPABASE_URL          = (your Supabase Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY     = (your Supabase anon key)
SUPABASE_SERVICE_ROLE_KEY         = (your Supabase service_role key)

ANTHROPIC_API_KEY                 = (your Anthropic key, starts with sk-ant-)

STRIPE_SECRET_KEY                 = (your Stripe secret key, starts with sk_test_ or sk_live_)
STRIPE_WEBHOOK_SECRET             = (leave blank for now — add after Part 8)
STRIPE_PRO_PRICE_ID               = (your Stripe Pro price ID, starts with price_)
STRIPE_AGENCY_PRICE_ID            = (your Stripe Agency price ID, starts with price_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = (your Stripe publishable key, starts with pk_)

RESEND_API_KEY                    = (your Resend API key)
RESEND_FROM_EMAIL                 = hello@contentstudio.pro

UPSTASH_REDIS_REST_URL            = (your Upstash URL)
UPSTASH_REDIS_REST_TOKEN          = (your Upstash token)

CRON_SECRET                       = (make up a random password, e.g. my-secret-cron-password-123)

NEXT_PUBLIC_APP_URL               = (leave blank for now — Vercel will fill this in automatically)
```

> Variables marked **optional** below can be added later:
> ```
> NEXT_PUBLIC_POSTHOG_KEY          = (optional — analytics)
> NEXT_PUBLIC_SENTRY_DSN          = (optional — error tracking)
> SENTRY_AUTH_TOKEN               = (optional — error tracking)
> BUFFER_CLIENT_ID                = (optional — Buffer scheduling)
> BUFFER_CLIENT_SECRET            = (optional — Buffer scheduling)
> TWITTER_CLIENT_ID               = (optional — direct Twitter posting)
> TWITTER_CLIENT_SECRET           = (optional — direct Twitter posting)
> LINKEDIN_CLIENT_ID              = (optional — direct LinkedIn posting)
> LINKEDIN_CLIENT_SECRET          = (optional — direct LinkedIn posting)
> NOTION_CLIENT_ID                = (optional — Notion export)
> NOTION_CLIENT_SECRET            = (optional — Notion export)
> ```

### Step 7.4 — Deploy

1. Click **Deploy**
2. Wait 2–4 minutes while Vercel builds and deploys your app
3. When it finishes, you will see a green "Congratulations!" screen
4. Your app is now live at a URL like `https://content-repurposing-app-abc123.vercel.app`
5. Copy this URL — you need it in the next step

### Step 7.5 — Set your app URL

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL` and set it to your Vercel URL (e.g. `https://content-repurposing-app-abc123.vercel.app`)
3. Go to **Deployments**, click the three dots next to your latest deployment, and click **Redeploy**

---

## Part 8 — Set Up the Stripe Webhook

A webhook is a way for Stripe to automatically tell your app when someone subscribes, upgrades, or cancels. Without this, your app will not know when payments succeed.

### Step 8.1 — Create the webhook

1. In your Stripe dashboard, click **Developers** → **Webhooks**
2. Click **Add endpoint**
3. In the **Endpoint URL** field, enter your Vercel URL followed by `/api/webhooks/stripe`:
   ```
   https://your-vercel-url.vercel.app/api/webhooks/stripe
   ```
4. Under **Events to listen to**, click **Select events** and choose all of these:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**

### Step 8.2 — Get the webhook signing secret

1. On the webhook page you just created, click **Reveal** next to **Signing secret**
2. Copy the value — it starts with `whsec_`
3. This is your `STRIPE_WEBHOOK_SECRET`

### Step 8.3 — Add it to Vercel

1. In Vercel, go to **Settings** → **Environment Variables**
2. Find `STRIPE_WEBHOOK_SECRET` and set it to the value you just copied
3. Go to **Deployments** and redeploy (same as Step 7.5)

---

## Part 9 — Set Up Supabase Auth Redirect URLs

Your app needs Supabase to know where to send users after they log in.

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL:
   ```
   https://your-vercel-url.vercel.app
   ```
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://your-vercel-url.vercel.app/auth/callback
   ```
4. Click **Save**

---

## Part 10 — Test Your Live App

Your app should now be fully functional. Let's verify everything works:

### Test 1 — Sign up

1. Open your Vercel URL in a browser
2. Click **Sign in** or **Get started**
3. Enter your email address and click to receive a magic link
4. Check your email and click the link
5. You should be logged in and see the dashboard

### Test 2 — Generate content

1. Go to the **Generate** page
2. Paste some text (a paragraph from an article, a blog post, anything)
3. Click **Generate**
4. Wait 15–30 seconds
5. You should see 7 different content formats appear

### Test 3 — Check usage limits

1. As a free user, you get 3 generations per day
2. After 3 generations, you should see an upgrade prompt

### Test 4 — Subscription (test mode)

1. Click **Upgrade** to see the pricing modal
2. Stripe is in test mode, so use this test card number: `4242 4242 4242 4242`
3. Use any future expiry date (e.g. `12/30`) and any 3-digit CVC (e.g. `123`)
4. Complete the checkout
5. You should be redirected back and your plan should upgrade to Pro

---

## Part 11 — Optional Integrations

These give your users more publishing options. Set them up whenever you are ready — the app works without them.

### Twitter / X Direct Publishing

Lets users post Twitter threads directly from the app.

1. Go to **developer.twitter.com** and sign in
2. Create a new project and app
3. Go to **Keys and Tokens** and copy:
   - **Client ID** → `TWITTER_CLIENT_ID`
   - **Client Secret** → `TWITTER_CLIENT_SECRET`
4. Under **User authentication settings**, set the callback URL to:
   ```
   https://your-vercel-url.vercel.app/api/publish/twitter/callback
   ```
5. Add these to Vercel environment variables and redeploy

### LinkedIn Direct Publishing

Lets users post to LinkedIn directly from the app.

1. Go to **linkedin.com/developers** and sign in
2. Create a new app
3. Under **Auth**, copy your **Client ID** and **Client Secret**
4. Add the OAuth redirect URL:
   ```
   https://your-vercel-url.vercel.app/api/publish/linkedin/callback
   ```
5. Request the `w_member_social` permission scope
6. Add `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` to Vercel and redeploy

### Buffer Scheduling

Lets users schedule posts to multiple platforms via Buffer.

1. Go to **buffer.com/developers** and create an account
2. Create a new app at **buffer.com/developers/apps**
3. Set the callback URL to:
   ```
   https://your-vercel-url.vercel.app/api/buffer/callback
   ```
4. Copy your **Client ID** and **Client Secret**
5. Add `BUFFER_CLIENT_ID` and `BUFFER_CLIENT_SECRET` to Vercel and redeploy

### Notion Export

Lets users export blog outlines as Notion pages.

1. Go to **notion.so/my-integrations** and sign in
2. Click **New integration**
3. Give it a name and choose your workspace
4. Set the redirect URI to:
   ```
   https://your-vercel-url.vercel.app/api/integrations/notion/callback
   ```
5. Copy your **Client ID** and **Client Secret**
6. Add `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` to Vercel and redeploy

### Posthog Analytics

Tracks how users interact with your app so you can improve it.

1. Go to **posthog.com** and create a free account
2. Create a new project
3. Copy your **Project API Key** from the project settings
4. Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel and redeploy

---

## Part 12 — Going Live with Real Payments

When you are ready to charge real money, switch Stripe from test mode to live mode.

1. In the Stripe dashboard, toggle from **Test mode** to **Live mode** (top-right switch)
2. Go to **Developers** → **API keys** and copy your **live** secret and publishable keys
3. Create your products again in live mode (repeat Part 4.3) and copy the new Price IDs
4. Create a new webhook in live mode (repeat Part 8) and get the new webhook secret
5. Update all Stripe-related variables in Vercel with the live values:
   - `STRIPE_SECRET_KEY` → live secret key (starts with `sk_live_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → live publishable key (starts with `pk_live_`)
   - `STRIPE_PRO_PRICE_ID` → new live price ID
   - `STRIPE_AGENCY_PRICE_ID` → new live price ID
   - `STRIPE_WEBHOOK_SECRET` → new live webhook secret
6. Redeploy from Vercel

---

## Custom Domain (Optional)

To use your own domain (e.g. `contentstudio.pro`) instead of the Vercel URL:

1. In Vercel, go to your project → **Settings** → **Domains**
2. Click **Add** and enter your domain name
3. Vercel will show you DNS records to add — follow their instructions (the process depends on who manages your domain)
4. Once verified, update `NEXT_PUBLIC_APP_URL` in your environment variables to your custom domain
5. Update the Stripe webhook URL to use your custom domain
6. Update the Supabase Site URL and redirect URLs to use your custom domain
7. If you set up Twitter/LinkedIn/Notion/Buffer OAuth, update their callback URLs too
8. Redeploy

---

## Troubleshooting

### "Something went wrong" when generating content
- Check that `ANTHROPIC_API_KEY` is correctly set in Vercel
- Make sure you have credits on your Anthropic account
- Check the Vercel logs: go to your project → **Deployments** → click latest → **Functions** tab

### Login email never arrives
- Check your spam folder
- Verify that your Supabase Site URL matches your actual URL (Part 9)
- Make sure `RESEND_API_KEY` is set if you are using a custom email domain

### Payments don't upgrade the user's plan
- Check that `STRIPE_WEBHOOK_SECRET` is correctly set in Vercel
- Verify the webhook URL is correct in Stripe (Part 8)
- Make sure you ran both database migrations (Part 2.3)
- Check Vercel function logs for errors

### The app deployed but shows a blank/error page
- Go to Vercel → **Deployments** → click the latest → look for build errors
- The most common cause is a missing environment variable
- Verify all required variables from Part 7.3 are set (the non-optional ones)

### Stripe test payments fail
- Use the test card `4242 4242 4242 4242` with any future date and any CVC
- Make sure you are in Stripe **Test mode** (not Live mode) during setup

---

## Quick Reference — All Environment Variables

| Variable | Where to find it | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Yes |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Yes |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks | Yes |
| `STRIPE_PRO_PRICE_ID` | Stripe → Products → Pro plan | Yes |
| `STRIPE_AGENCY_PRICE_ID` | Stripe → Products → Agency plan | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys | Yes |
| `RESEND_API_KEY` | resend.com → API Keys | Yes |
| `RESEND_FROM_EMAIL` | Your sending email address | Yes |
| `UPSTASH_REDIS_REST_URL` | upstash.com → Database → REST API | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | upstash.com → Database → REST API | Yes |
| `CRON_SECRET` | Make up any random password | Yes |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | posthog.com → Project Settings | Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → Project → Settings | Optional |
| `SENTRY_AUTH_TOKEN` | sentry.io → Settings → Auth Tokens | Optional |
| `BUFFER_CLIENT_ID` | buffer.com/developers/apps | Optional |
| `BUFFER_CLIENT_SECRET` | buffer.com/developers/apps | Optional |
| `TWITTER_CLIENT_ID` | developer.twitter.com | Optional |
| `TWITTER_CLIENT_SECRET` | developer.twitter.com | Optional |
| `LINKEDIN_CLIENT_ID` | linkedin.com/developers | Optional |
| `LINKEDIN_CLIENT_SECRET` | linkedin.com/developers | Optional |
| `NOTION_CLIENT_ID` | notion.so/my-integrations | Optional |
| `NOTION_CLIENT_SECRET` | notion.so/my-integrations | Optional |

---

## Summary Checklist

Use this to track your progress:

- [ ] GitHub account created and repository forked
- [ ] Supabase project created
- [ ] Supabase credentials saved (URL, anon key, service role key)
- [ ] Both database migrations run successfully
- [ ] Supabase email auth enabled
- [ ] Anthropic account created and API key saved
- [ ] Stripe account created and API keys saved
- [ ] Stripe Pro and Agency products created and Price IDs saved
- [ ] Resend account created and API key saved
- [ ] Upstash account created and credentials saved
- [ ] Vercel account created and project imported
- [ ] All environment variables added to Vercel
- [ ] First deployment successful
- [ ] `NEXT_PUBLIC_APP_URL` set and redeployed
- [ ] Stripe webhook created and `STRIPE_WEBHOOK_SECRET` added
- [ ] Supabase auth redirect URLs updated
- [ ] Test signup works (magic link email received)
- [ ] Test generation works (content generated successfully)
- [ ] Test payment works (plan upgrades after checkout)
- [ ] (Optional) Twitter integration configured
- [ ] (Optional) LinkedIn integration configured
- [ ] (Optional) Buffer integration configured
- [ ] (Optional) Notion integration configured
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Switched to Stripe live mode for real payments
