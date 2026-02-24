import { Page, expect } from "@playwright/test"
import { hasMerchantCreds, hasAdminCreds } from "./env"

/**
 * Login as merchant using E2E credentials
 */
export async function merchantLogin(page: Page): Promise<void> {
  if (!hasMerchantCreds) {
    throw new Error("E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD must be set")
  }

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" })
  await page.fill('input[type="email"]', process.env.E2E_MERCHANT_EMAIL!)
  await page.fill('input[type="password"]', process.env.E2E_MERCHANT_PASSWORD!)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/dashboard/i, { timeout: 15_000 })
}

/**
 * Login as admin using E2E credentials
 */
export async function adminLogin(page: Page): Promise<void> {
  if (!hasAdminCreds) {
    throw new Error("E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set")
  }

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" })
  await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL!)
  await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD!)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/admin|_admin/i, { timeout: 15_000 })
}
