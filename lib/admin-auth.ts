import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

/**
 * Get the list of platform admin emails from environment variable
 * Format: comma-separated list of email addresses
 * Example: SELLARITY_ADMIN_EMAILS="admin1@example.com,admin2@example.com"
 */
function getAdminEmails(): string[] {
  const emails = process.env.SELLARITY_ADMIN_EMAILS
  if (!emails) {
    return []
  }
  return emails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Get the list of super admin user IDs from environment variable
 * Format: comma-separated list of Clerk user IDs
 * Example: SUPER_ADMIN_USER_IDS="user_xxx,user_yyy"
 */
function getSuperAdminUserIds(): string[] {
  const userIds = process.env.SUPER_ADMIN_USER_IDS
  if (!userIds) {
    return []
  }
  return userIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Get the list of admin user IDs from environment variable
 * Format: comma-separated list of Clerk user IDs
 * Example: ADMIN_USER_IDS="user_xxx,user_yyy"
 */
function getAdminUserIds(): string[] {
  const userIds = process.env.ADMIN_USER_IDS
  if (!userIds) {
    return []
  }
  return userIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Check if the current user is a platform admin (email-based)
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const { userId } = auth()
  if (!userId) {
    return false
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return false
  }

  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress
  if (!primaryEmail) {
    return false
  }

  const adminEmails = getAdminEmails()
  return adminEmails.includes(primaryEmail.toLowerCase())
}

/**
 * Check if the current user is a super admin (user ID-based)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const { userId } = auth()
  if (!userId) {
    return false
  }

  const superAdminIds = getSuperAdminUserIds()
  return superAdminIds.includes(userId)
}

/**
 * Check if the current user is an admin (user ID-based, includes super admins)
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = auth()
  if (!userId) {
    return false
  }

  const adminIds = getAdminUserIds()
  const superAdminIds = getSuperAdminUserIds()
  return adminIds.includes(userId) || superAdminIds.includes(userId)
}

/**
 * Require platform admin access - redirects to /dashboard if not admin
 * Use this in admin pages and API routes
 */
export async function requirePlatformAdmin() {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    redirect("/dashboard")
  }
  return true
}

/**
 * Require super admin access - redirects to /dashboard if not super admin
 * Returns actor info for audit logging
 */
export async function requireSuperAdmin(): Promise<{
  userId: string
  email: string
  name: string | null
}> {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    redirect("/dashboard")
  }

  const actor = await getAdminIdentity()
  if (!actor) {
    redirect("/dashboard")
  }

  return actor
}

/**
 * Require admin access (admin or super admin) - redirects to /dashboard if not admin
 * Use this for general admin operations
 */
export async function requireAdmin() {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect("/dashboard")
  }
  return true
}

/**
 * Get platform admin identity (userId, email, name)
 * Returns null if not a platform admin
 */
export async function getPlatformAdminIdentity(): Promise<{
  userId: string
  email: string
  name: string | null
} | null> {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    return null
  }

  const { userId } = auth()
  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return null
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress || ""
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null

  return { userId, email, name }
}

/**
 * Get admin identity (for audit logging)
 */
export async function getAdminIdentity(): Promise<{
  userId: string
  email: string
  name: string | null
} | null> {
  const { userId } = auth()
  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return null
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress || ""
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null

  return { userId, email, name }
}
