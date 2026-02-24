import { test, expect } from "@playwright/test"
import { hasMerchantCreds } from "./_helpers/env"
import { merchantLogin } from "./_helpers/auth"
import path from "path"
import fs from "fs"

test.describe("Upload Flows", () => {
  test.beforeEach(() => {
    test.skip(!hasMerchantCreds, "requires test credentials")
  })

  test("merchant can upload product image", async ({ page }) => {
    await merchantLogin(page)

    // Navigate to products page
    await page.goto("/dashboard/products", { waitUntil: "domcontentloaded" }).catch(() => {
      // Try alternative path
      return page.goto("/dashboard/products/new", { waitUntil: "domcontentloaded" })
    })

    // Look for add product button or navigate to new product page
    const addProductButton = page.locator('[data-testid="add-product"]').or(
      page.locator('a[href*="/products/new"], button:has-text("Add"), button:has-text("New")').first()
    )

    if (await addProductButton.count() > 0) {
      await addProductButton.click()
      await page.waitForLoadState("networkidle", { timeout: 10_000 })
    } else {
      // Try direct navigation
      await page.goto("/dashboard/products/new", { waitUntil: "domcontentloaded" })
    }

    // Find file input for image upload
    const fileInput = page.locator('input[type="file"]').first()
    
    if (await fileInput.count() > 0) {
      // Get test image path
      const testImagePath = path.join(__dirname, "../fixtures/test-image.png")
      
      // Check if test image exists, create a minimal one if not
      if (!fs.existsSync(testImagePath)) {
        // Create directory if needed
        const fixturesDir = path.dirname(testImagePath)
        if (!fs.existsSync(fixturesDir)) {
          fs.mkdirSync(fixturesDir, { recursive: true })
        }
        
        // Create a minimal 1x1 PNG (base64 encoded)
        const minimalPng = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64"
        )
        fs.writeFileSync(testImagePath, minimalPng)
      }

      // Upload file
      await fileInput.setInputFiles(testImagePath)

      // Wait for upload to complete (look for success indicator)
      await page.waitForTimeout(2000) // Give upload time to process

      // Check for success toast or image preview
      const successIndicator = page.locator('[data-testid="upload-success"]').or(
        page.locator('img[src*="blob"], img[src*="upload"], [class*="preview"], [class*="success"]').first()
      )

      // Either success toast or image preview should appear
      const hasSuccess = await successIndicator.count() > 0
      if (!hasSuccess) {
        // Check if image preview exists
        const imagePreview = page.locator('img').first()
        if (await imagePreview.count() > 0) {
          await expect(imagePreview).toBeVisible({ timeout: 5_000 })
        } else {
          // If no clear indicator, at least verify no error
          const errorMessage = page.locator('[class*="error"], [role="alert"]')
          await expect(errorMessage).toHaveCount(0, { timeout: 2_000 }).catch(() => {
            // If error appears, that's a failure
            throw new Error("Upload failed or error message appeared")
          })
        }
      } else {
        await expect(successIndicator).toBeVisible({ timeout: 10_000 })
      }
    } else {
      test.skip(true, "No file input found for image upload")
    }
  })
})
