/**
 * Central feature flags for Merceton admin and app modules.
 * Default: all enabled. Override via env vars (e.g. FEATURE_ADMIN_AUDIT_LOGS=false).
 * Env vars are read once at module load; restart server after changing.
 */

function envFlag(key: string, defaultValue: boolean): boolean {
  const v = process.env[key]
  if (v === undefined || v === "") return defaultValue
  return v.trim().toLowerCase() === "true" || v === "1"
}

export const featureFlags = {
  // Admin: merchants (list, detail, hold, release, kyc, ledger)
  adminMerchants: envFlag("FEATURE_ADMIN_MERCHANTS", true),
  adminMerchantsHoldRelease: envFlag("FEATURE_ADMIN_MERCHANTS_HOLD_RELEASE", true),
  adminMerchantsKyc: envFlag("FEATURE_ADMIN_MERCHANTS_KYC", true),
  adminMerchantsLedger: envFlag("FEATURE_ADMIN_MERCHANTS_LEDGER", true),

  // Admin: admin users & roles (RBAC)
  adminAdminUsers: envFlag("FEATURE_ADMIN_ADMIN_USERS", true),
  adminRoles: envFlag("FEATURE_ADMIN_ROLES", true),

  // Admin: audit logs, system settings, billing profile
  adminAuditLogs: envFlag("FEATURE_ADMIN_AUDIT_LOGS", true),
  adminSystemSettings: envFlag("FEATURE_ADMIN_SYSTEM_SETTINGS", true),
  adminBillingProfile: envFlag("FEATURE_ADMIN_BILLING_PROFILE", true),

  // Merchant billing: statement CSV, invoice PDF
  billingStatement: envFlag("FEATURE_BILLING_STATEMENT", true),
  billingInvoicePdf: envFlag("FEATURE_BILLING_INVOICE_PDF", true),
} as const

export type FeatureFlagKey = keyof typeof featureFlags

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag]
}
