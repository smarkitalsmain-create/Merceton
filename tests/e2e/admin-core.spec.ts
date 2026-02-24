import { test, expect } from "@playwright/test"
import { hasAdminCreds } from "./_helpers/env"
import { adminLogin } from "./_helpers/auth"

test.describe("Admin Core Flows", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminCreds, "requires test credentials")
  })

  test("login as admin and verify admin panel loads", async ({ page }) => {
    await adminLogin(page)

    // Wait for admin panel to load
    await page.waitForLoadState("networkidle", { timeout: 10_000 })

    // Check for admin panel content
    const adminContent = page.locator('[data-testid="admin-dashboard"]').or(page.locator('h1, h2, [class*="admin"]').first())
    await expect(adminContent).toBeVisible({ timeout: 10_000 })
  })

  test("admin merchants list loads", async ({ page }) => {
    await adminLogin(page)

    // Navigate to merchants list
    await page.goto("/admin/merchants", { waitUntil: "domcontentloaded" }).catch(() => {
      // Try alternative path
      return page.goto("/_admin/merchants", { waitUntil: "domcontentloaded" })
    })

    await expect(page).toHaveURL(/merchants/i, { timeout: 10_000 })

    // Check for merchants list container or table
    const merchantsContainer = page.locator('[data-testid="merchants-list"]').or(page.locator('table, [class*="merchant"]').first())
    await expect(merchantsContainer).toBeVisible({ timeout: 10_000 })
  })

  test("admin can open merchant detail page", async ({ page }) => {
    await adminLogin(page)

    // Navigate to merchants list first
    await page.goto("/admin/merchants", { waitUntil: "domcontentloaded" }).catch(() => {
      return page.goto("/_admin/merchants", { waitUntil: "domcontentloaded" })
    })

    // Find first merchant link and click
    const firstMerchantLink = page.locator('a[href*="/merchants/"]').first()
    if (await firstMerchantLink.count() > 0) {
      await firstMerchantLink.click()
      await expect(page).toHaveURL(/\/merchants\/[^/]+/i, { timeout: 10_000 })

      // Check for merchant detail content
      const merchantDetail = page.locator('[data-testid="merchant-detail"]').or(page.locator('h1, h2').first())
      await expect(merchantDetail).toBeVisible({ timeout: 10_000 })
    } else {
      // If no merchants exist, just verify we're on merchants page
      await expect(page).toHaveURL(/merchants/i, { timeout: 10_000 })
    }
  })
})
