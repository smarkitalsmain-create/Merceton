/**
 * Parse SUPER_ADMIN_EMAIL (single) or SUPER_ADMIN_EMAILS (comma-separated) into a normalized allowlist.
 * Handles:
 * - SUPER_ADMIN_EMAIL takes precedence if set (single email)
 * - Otherwise SUPER_ADMIN_EMAILS (comma-separated)
 * - Whitespace trimming and case normalization (lowercase)
 * - Empty string filtering
 */
export function getSuperAdminAllowlist(): string[] {
  const single = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase()
  if (single) {
    return [single]
  }
  const raw = process.env.SUPER_ADMIN_EMAILS ?? ""
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (process.env.NODE_ENV === "development" && list.length === 0) {
    console.warn(
      "[admin-allowlist] SUPER_ADMIN_EMAIL and SUPER_ADMIN_EMAILS are both missing or empty. Set SUPER_ADMIN_EMAIL or SUPER_ADMIN_EMAILS in .env to enable super admin access."
    )
  }
  return list
}

/**
 * Check if an email is in the super admin allowlist (robust match).
 * Uses trimmed, lowercased comparison for both env value and user email.
 */
export function isEmailInAllowlist(email: string | null | undefined): boolean {
  const userEmail = (email ?? "").trim().toLowerCase()
  if (!userEmail) {
    return false
  }
  const allowlist = getSuperAdminAllowlist()
  return allowlist.includes(userEmail)
}

/**
 * Check if SUPER_ADMIN_EMAIL or SUPER_ADMIN_EMAILS is configured.
 */
export function isAllowlistConfigured(): boolean {
  const list = getSuperAdminAllowlist()
  return list.length > 0
}
