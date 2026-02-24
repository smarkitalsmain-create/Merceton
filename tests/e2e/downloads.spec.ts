import { test, expect } from "@playwright/test"
import { hasMerchantCreds, hasAdminCreds } from "./_helpers/env"
import { merchantLogin, adminLogin } from "./_helpers/auth"
import path from "path"
import fs from "fs"

test.describe("Download Flows", () => {
  test.describe("Merchant Downloads", () => {
    test.beforeEach(() => {
      test.skip(!hasMerchantCreds, "requires test credentials")
    })

    test("merchant can download order invoice PDF", async ({ page }) => {
      await merchantLogin(page)

      // Navigate to orders page
      await page.goto("/dashboard/orders", { waitUntil: "domcontentloaded" })

      // Find first order and navigate to its detail/invoice page
      const orderLink = page.locator('a[href*="/orders/"]').first()
      
      if (await orderLink.count() > 0) {
        await orderLink.click()
        await page.waitForLoadState("networkidle", { timeout: 10_000 })

        // Look for invoice download button or link
        const downloadButton = page.locator('[data-testid="download-invoice"]').or(
          page.locator('a[href*="invoice"], button:has-text("Invoice"), a:has-text("Download")').first()
        )

        if (await downloadButton.count() > 0) {
          // Set up download listener
          const downloadPromise = page.waitForEvent("download", { timeout: 10_000 })
          await downloadButton.click()
          const download = await downloadPromise

          // Verify download
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
          const filePath = await download.path()
          if (filePath) {
            const stats = fs.statSync(filePath)
            expect(stats.size).toBeGreaterThan(0)
          }
        } else {
          // If no download button found, try direct invoice route
          const currentUrl = page.url()
          const orderIdMatch = currentUrl.match(/\/orders\/([^/]+)/)
          if (orderIdMatch) {
            const orderId = orderIdMatch[1]
            const invoiceUrl = `/dashboard/orders/${orderId}/invoice`
            
            const response = await page.goto(invoiceUrl, { waitUntil: "networkidle" })
            if (response) {
              expect(response.headers()["content-type"]).toMatch(/pdf|application\/pdf/i)
              expect(response.status()).toBe(200)
            }
          }
        }
      } else {
        test.skip(true, "No orders found to test invoice download")
      }
    })
  })

  test.describe("Admin Downloads", () => {
    test.beforeEach(() => {
      test.skip(!hasAdminCreds, "requires test credentials")
    })

    test("admin can download merchant ledger CSV", async ({ page }) => {
      await adminLogin(page)

      // Navigate to a merchant detail page
      await page.goto("/admin/merchants", { waitUntil: "domcontentloaded" }).catch(() => {
        return page.goto("/_admin/merchants", { waitUntil: "domcontentloaded" })
      })

      const firstMerchantLink = page.locator('a[href*="/merchants/"]').first()
      
      if (await firstMerchantLink.count() > 0) {
        await firstMerchantLink.click()
        await page.waitForLoadState("networkidle", { timeout: 10_000 })

        // Look for ledger download button
        const downloadButton = page.locator('[data-testid="download-ledger"]').or(
          page.locator('a[href*="ledger"], a[href*="csv"], button:has-text("Ledger"), a:has-text("Export")').first()
        )

        if (await downloadButton.count() > 0) {
          const downloadPromise = page.waitForEvent("download", { timeout: 10_000 })
          await downloadButton.click()
          const download = await downloadPromise

          expect(download.suggestedFilename()).toMatch(/\.csv$/i)
          const filePath = await download.path()
          if (filePath) {
            const stats = fs.statSync(filePath)
            expect(stats.size).toBeGreaterThan(0)

            // Verify CSV has header and at least one row
            const content = fs.readFileSync(filePath, "utf-8")
            const lines = content.split("\n").filter((line) => line.trim())
            expect(lines.length).toBeGreaterThan(1) // Header + at least 1 row
          }
        } else {
          // Try direct API route if available
          const currentUrl = page.url()
          const merchantIdMatch = currentUrl.match(/\/merchants\/([^/]+)/)
          if (merchantIdMatch) {
            const merchantId = merchantIdMatch[1]
            const ledgerUrl = `/api/admin/merchants/${merchantId}/ledger`
            
            const response = await page.goto(ledgerUrl, { waitUntil: "networkidle" })
            if (response) {
              expect(response.headers()["content-type"]).toMatch(/csv|text\/csv/i)
              expect(response.status()).toBe(200)
            }
          }
        }
      } else {
        test.skip(true, "No merchants found to test ledger download")
      }
    })
  })
})
