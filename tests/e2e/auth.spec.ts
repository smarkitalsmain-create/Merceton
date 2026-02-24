import { test, expect } from "@playwright/test"

test.describe("Authentication and Protected Routes", () => {
  test("redirects /dashboard to /sign-in when logged out", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/sign-in|login/i, { timeout: 10_000 })
  })

  test("redirects /admin to /sign-in when logged out", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/sign-in|login/i, { timeout: 10_000 })
  })

  test("redirects /_admin to /sign-in when logged out", async ({ page }) => {
    await page.goto("/_admin", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/sign-in|login/i, { timeout: 10_000 })
  })
})
