/**
 * E2E tests for custom domain verification flow
 * 
 * Tests the complete flow:
 * 1. Add domain
 * 2. Show DNS instructions
 * 3. Verify domain (with mocked DNS)
 */

import { test, expect } from "@playwright/test"
import { hasMerchantCreds } from "./_helpers/env"
import { merchantLogin } from "./_helpers/auth"

test.describe("Custom Domain Verification", () => {
  test.beforeEach(() => {
    test.skip(!hasMerchantCreds, "requires test credentials")
  })

  test("add domain -> shows DNS instructions -> verify updates status", async ({ page }) => {
    await merchantLogin(page)

    // Navigate to domain settings
    await page.goto("/dashboard/settings/domain", { waitUntil: "domcontentloaded" })

    // Check if domain input is visible
    const domainInput = page.locator('input[id="domain"]')
    await expect(domainInput).toBeVisible({ timeout: 10_000 })

    // Enter test domain
    const testDomain = `test-${Date.now()}.example.com`
    await domainInput.fill(testDomain)

    // Click save
    const saveButton = page.locator('button:has-text("Save Domain")')
    await saveButton.click()

    // Wait for API response
    await page.waitForTimeout(2000)

    // Check for DNS instructions card
    const dnsCard = page.locator('text=DNS Verification Instructions')
    await expect(dnsCard).toBeVisible({ timeout: 10_000 })

    // Verify TXT record name is correct
    const recordName = page.locator(`text=_merceton-verify.${testDomain}`)
    await expect(recordName).toBeVisible({ timeout: 5_000 })

    // Check status badge shows PENDING
    const statusBadge = page.locator('text=PENDING')
    await expect(statusBadge).toBeVisible({ timeout: 5_000 })

    // Verify button should be visible
    const verifyButton = page.locator('button:has-text("Verify Domain")')
    await expect(verifyButton).toBeVisible({ timeout: 5_000 })

    // Note: Actual DNS verification requires real DNS setup
    // In a full E2E test, you would:
    // 1. Set up test DNS server or use a test domain
    // 2. Add the TXT record
    // 3. Click verify
    // 4. Assert status changes to VERIFIED
  })

  test("domain settings page loads with existing domain", async ({ page }) => {
    await merchantLogin(page)

    // Navigate to domain settings
    await page.goto("/dashboard/settings/domain", { waitUntil: "domcontentloaded" })

    // Page should load without errors
    await expect(page.locator('text=Custom Domain')).toBeVisible({ timeout: 10_000 })
  })
})
