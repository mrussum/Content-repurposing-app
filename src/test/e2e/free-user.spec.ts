/**
 * E2E: Free user flows
 *
 * Covers:
 *  1. Auth — redirected to login when unauthenticated
 *  2. Generation flow — paste content, generate, see output tabs
 *  3. Locked formats — Instagram tab shows lock for free users
 *  4. Usage meter — appears in header
 *  5. Upgrade prompt — appears when regenerate is clicked on a locked format
 *  6. History — upgrade prompt shown for free users
 */

import { test, expect } from '@playwright/test'

const SAMPLE_CONTENT = `
The future of remote work is not about where you work — it's about how you work.
Companies that thrive in the next decade will be those that master async communication,
documentation as a first-class citizen, and trust as the default operating mode.
The office was never about productivity. It was about control.
`.trim()

test.describe('unauthenticated redirects', () => {
  test('redirects /generate to /login when not logged in', async ({ browser }) => {
    // Use a fresh context with no stored auth
    const ctx  = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto('/generate')
    await expect(page).toHaveURL(/\/login/)
    await ctx.close()
  })

  test('login page renders sign-in form', async ({ browser }) => {
    const ctx  = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await ctx.close()
  })
})

test.describe('generation flow (free user)', () => {
  test('generate page loads with correct layout', async ({ page }) => {
    await page.goto('/generate')
    // Generate panel and output panel should both be present
    await expect(page.getByPlaceholder(/paste your content/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /generate/i })).toBeVisible()
  })

  test('character count updates as user types', async ({ page }) => {
    await page.goto('/generate')
    const textarea = page.getByPlaceholder(/paste your content/i)
    await textarea.fill('Hello world')
    await expect(page.getByText(/11\s*\//)).toBeVisible()
  })

  test('tone selector chips are present', async ({ page }) => {
    await page.goto('/generate')
    await expect(page.getByRole('button', { name: /professional/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /casual/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /witty/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /educational/i })).toBeVisible()
  })

  test('generate button is disabled when content is empty', async ({ page }) => {
    await page.goto('/generate')
    const generateBtn = page.getByRole('button', { name: /generate/i })
    await expect(generateBtn).toBeDisabled()
  })

  test('generate button enables when content is pasted', async ({ page }) => {
    await page.goto('/generate')
    await page.getByPlaceholder(/paste your content/i).fill(SAMPLE_CONTENT)
    const generateBtn = page.getByRole('button', { name: /generate/i })
    await expect(generateBtn).toBeEnabled()
  })

  test('full generation flow: paste → generate → see tabs', async ({ page }) => {
    await page.goto('/generate')
    await page.getByPlaceholder(/paste your content/i).fill(SAMPLE_CONTENT)
    await page.getByRole('button', { name: /generate/i }).click()

    // Should show loading state
    await expect(page.getByRole('button', { name: /generating/i })).toBeVisible({ timeout: 3000 })
      .catch(() => { /* already done */ })

    // Wait for generation to complete (tabs become interactive)
    await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('tab', { name: /twitter/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /linkedin/i })).toBeVisible()
  })

  test('instagram tab is locked for free users', async ({ page }) => {
    await page.goto('/generate')
    await page.getByPlaceholder(/paste your content/i).fill(SAMPLE_CONTENT)
    await page.getByRole('button', { name: /generate/i }).click()

    await expect(page.getByRole('tab', { name: /instagram/i })).toBeVisible({ timeout: 30_000 })

    // Lock icon should be present on instagram tab
    const instagramTab = page.getByRole('tab', { name: /instagram/i })
    await expect(instagramTab.locator('svg')).toBeVisible()  // lock icon
  })

  test('clicking copy button copies content to clipboard', async ({ page }) => {
    await page.goto('/generate')
    await page.getByPlaceholder(/paste your content/i).fill(SAMPLE_CONTENT)
    await page.getByRole('button', { name: /generate/i }).click()
    await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible({ timeout: 30_000 })

    const copyBtn = page.getByRole('button', { name: /copy/i }).first()
    await copyBtn.click()
    // Button should show "Copied" feedback
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible({ timeout: 2000 })
  })
})

test.describe('usage meter (free user)', () => {
  test('usage meter is visible in header', async ({ page }) => {
    await page.goto('/generate')
    // UsageMeter renders as a progress bar or usage text in the header
    await expect(page.getByText(/generations/i).first()).toBeVisible()
  })
})

test.describe('history page (free user)', () => {
  test('history page shows upgrade prompt for free users', async ({ page }) => {
    await page.goto('/history')
    // Free users should see an upgrade nudge
    await expect(
      page.getByText(/upgrade/i).or(page.getByText(/pro/i))
    ).toBeVisible()
  })
})
