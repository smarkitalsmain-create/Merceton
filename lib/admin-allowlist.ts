/**
 * Parse SUPER_ADMIN_EMAILS environment variable into a normalized allowlist.
 * Handles:
 * - Comma-separated values
 * - Whitespace trimming
 * - Case normalization (lowercase)
 * - Empty string filtering
 */
export function getSuperAdminAllowlist(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? ""
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Check if an email is in the super admin allowlist.
 * @param email - The email to check (will be normalized)
 * @returns true if email is in allowlist, false otherwise
 */
export function isEmailInAllowlist(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  const allowlist = getSuperAdminAllowlist()

  return !!(normalizedEmail && allowlist.includes(normalizedEmail))
}

/**
 * Check if SUPER_ADMIN_EMAILS is configured.
 * @returns true if env var exists and has at least one email
 */
export function isAllowlistConfigured(): boolean {
  const allowlist = getSuperAdminAllowlist()
  return allowlist.length > 0
}
