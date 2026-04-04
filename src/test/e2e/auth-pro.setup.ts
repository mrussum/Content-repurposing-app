/**
 * Auth setup for pro-user E2E tests.
 * Mirrors auth.setup.ts but for a pre-seeded pro-plan account.
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(process.cwd(), 'playwright/.auth/pro-user.json')

setup('authenticate as pro user', async ({ page }) => {
  const email    = process.env.E2E_PRO_USER_EMAIL    ?? 'pro@test.contentstudio.local'
  const password = process.env.E2E_PRO_USER_PASSWORD ?? 'test-password-pro-123'

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

  await page.getByLabel(/email/i).fill(email)

  const passwordField = page.getByLabel(/password/i)
  if (await passwordField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await passwordField.fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()
  } else {
    return
  }

  await page.waitForURL(/\/(generate|dashboard|onboarding)/)
  await page.context().storageState({ path: AUTH_FILE })
})
