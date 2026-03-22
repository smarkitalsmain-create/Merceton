/**
 * Legacy email allowlist for `lib/admin.ts` (separate from `ADMIN_USER_IDS` in admin-auth).
 */
export function isEmailInAllowlist(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL_ALLOWLIST || ""
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (allow.length === 0 && process.env.NODE_ENV === "development") {
    return true
  }
  return allow.includes(email.toLowerCase())
}
