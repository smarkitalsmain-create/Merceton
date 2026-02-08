import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

/**
 * Get the list of admin user IDs from environment variable
 * Format: comma-separated list of Clerk user IDs
 */
function getAdminAllowlist(): string[] {
  const allowlist = process.env.ADMIN_USER_IDS
  if (!allowlist) {
    return []
  }
  return allowlist.split(",").map((id) => id.trim()).filter(Boolean)
}

/**
 * Check if the current user is an admin (platform owner)
 * Based on allowlist of auth user IDs in environment variable
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = auth()
  if (!userId) {
    return false
  }

  const allowlist = getAdminAllowlist()
  return allowlist.includes(userId)
}

/**
 * Require admin access - redirects to home if not admin
 */
export async function requireAdmin() {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect("/")
  }
  return true
}
