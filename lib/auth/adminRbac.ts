import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isEmailInAllowlist } from "@/lib/admin-allowlist"

/**
 * Permission keys for RBAC
 * Format: {resource}.{action}
 */
export const PERMISSIONS = {
  // Billing Profile
  BILLING_PROFILE_READ: "billing_profile.read",
  BILLING_PROFILE_WRITE: "billing_profile.write",

  // Admin Users
  ADMIN_USERS_READ: "admin_users.read",
  ADMIN_USERS_WRITE: "admin_users.write",
  ADMIN_USERS_DELETE: "admin_users.delete",

  // Roles & Permissions
  ROLES_READ: "roles.read",
  ROLES_WRITE: "roles.write",
  ROLES_DELETE: "roles.delete",

  // Audit Logs
  AUDIT_LOGS_READ: "audit_logs.read",

  // System Settings
  SYSTEM_SETTINGS_READ: "system_settings.read",
  SYSTEM_SETTINGS_WRITE: "system_settings.write",

  // Platform Invoices
  PLATFORM_INVOICES_READ: "platform_invoices.read",
  PLATFORM_INVOICES_WRITE: "platform_invoices.write",

  // Payouts
  PAYOUTS_READ: "payouts.read",
  PAYOUTS_EXECUTE: "payouts.execute",

  // Merchants
  MERCHANTS_READ: "merchants.read",
  MERCHANTS_WRITE: "merchants.write",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Require super admin access
 */
export async function requireSuperAdmin() {
  const supabase = createSupabaseServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, email: true },
  })

  if (!dbUser) {
    redirect("/unauthorized")
  }

  // Check if user is in super admin allowlist (email-based)
  if (!isEmailInAllowlist(dbUser.email)) {
    redirect("/unauthorized")
  }

  return dbUser
}

/**
 * Get admin user by Supabase userId
 * NOTE: AdminUser model removed - using allowlist-based auth only
 */
export async function getAdminUser(userId: string) {
  // Admin module disabled - return null
  return null
}

/**
 * Check if admin user has a specific permission
 * NOTE: RBAC disabled - only allowlist-based super admin access
 */
export async function hasPermission(
  userId: string,
  permissionKey: PermissionKey
): Promise<boolean> {
  // Only allowlist-based super admins have permissions
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: userId },
    select: { email: true },
  })
  
  return dbUser ? isEmailInAllowlist(dbUser.email) : false
}

/**
 * Require admin user to have a specific permission
 * Throws Response with 403 if permission denied
 */
export async function requirePermission(permissionKey: PermissionKey) {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect("/sign-in")
  }

  const hasPerm = await hasPermission(user.id, permissionKey)
  if (!hasPerm) {
    // Use global Response constructor (not imported)
    throw new Response("Forbidden: Insufficient permissions", { status: 403 })
  }

  return user.id
}

/**
 * Get admin user with permissions (for use in pages)
 * NOTE: RBAC disabled - only allowlist-based super admin access
 */
export async function getAdminUserWithPermissions() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { email: true },
  })

  if (!dbUser || !isEmailInAllowlist(dbUser.email)) {
    return null
  }

  // Super admin has all permissions
  const permissions = new Set<PermissionKey>()
  Object.values(PERMISSIONS).forEach((perm) => permissions.add(perm))

  return {
    userId: user.id,
    email: dbUser.email,
    isActive: true,
    permissions: Array.from(permissions),
  }
}

/**
 * Create audit log entry
 * NOTE: AdminAuditLog model removed - logging disabled
 */
export async function createAuditLog(data: {
  actorUserId: string
  actorEmail?: string | null
  action: string
  entityType: string
  entityId?: string | null
  reason?: string | null
  beforeJson?: any
  afterJson?: any
  ip?: string | null
  userAgent?: string | null
  metadata?: any
}) {
  // Audit logging disabled - just log to console
  console.log("[Audit]", {
    actor: data.actorEmail || data.actorUserId,
    action: data.action,
    entity: `${data.entityType}:${data.entityId || "N/A"}`,
  })
  return null
}
