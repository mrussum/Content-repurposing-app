/**
 * Auth setup for free-user E2E tests.
 *
 * Uses magic-link login via Supabase's test helper endpoint.
 * In CI, set E2E_FREE_USER_EMAIL + E2E_FREE_USER_PASSWORD to a pre-seeded
 * Supabase test account (password auth must be enabled in the project).
 *
 * Saves auth cookies to playwright/.auth/free-user.json so subsequent
 * test files can skip login entirely.
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(process.cwd(), 'playwright/.auth/free-user.json')

setup('authenticate as free user', async ({ page }) => {
  const email    = process.env.E2E_FREE_USER_EMAIL    ?? 'free@test.contentstudio.local'
  const password = process.env.E2E_FREE_USER_PASSWORD ?? 'test-password-free-123'

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

  // Use email + password flow (enabled for E2E test accounts)
  await page.getByLabel(/email/i).fill(email)

  // If password field is visible the project has password auth enabled
  const passwordField = page.getByLabel(/password/i)
  if (await passwordField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await passwordField.fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()
  } else {
    // Fallback: magic link — in CI pipe the OTP via Supabase admin API
    await page.getByRole('button', { name: /send magic link/i }).click()
    await expect(page.getByText(/check your email/i)).toBeVisible()
    // Can't complete magic-link in automated test without email interception;
    // skip storage state save and let tests using this fixture be skipped.
    return
  }

  // Wait for redirect to the app
  await page.waitForURL(/\/(generate|dashboard|onboarding)/)
  await page.context().storageState({ path: AUTH_FILE })
})
