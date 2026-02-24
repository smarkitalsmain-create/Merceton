/**
 * E2E Environment Detection
 * 
 * Detects if test credentials are available for credential-gated tests.
 */

export const hasMerchantCreds =
  !!process.env.E2E_MERCHANT_EMAIL && !!process.env.E2E_MERCHANT_PASSWORD

export const hasAdminCreds =
  !!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD

export const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000"
