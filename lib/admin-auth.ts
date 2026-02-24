import { redirect } from "next/navigation"
import { createSupabaseAdminServerReadonlyClient } from "@/lib/supabase/admin-server-readonly"
import { isEmailInAllowlist } from "@/lib/admin-allowlist"
import { prisma } from "@/lib/prisma"

/**
 * Check if the current user is a super admin (email-based)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = createSupabaseAdminServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return false
  }

  return isEmailInAllowlist(user.email)
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
  const supabase = createSupabaseAdminServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/sign-in")
  }

  const isSuper = !!isEmailInAllowlist(user.email)

  if (!isSuper) {
    redirect("/dashboard")
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
  }
}

/**
 * Require admin access (platform admin - email allowlist based)
 * Throws error with message "UNAUTHORIZED" or "FORBIDDEN" for API routes to catch
 * For page routes, use requireSuperAdmin() which redirects
 */
export async function requireAdmin(): Promise<{
  userId: string
  email: string
  name: string | null
}> {
  const supabase = createSupabaseAdminServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const error = new Error("UNAUTHORIZED")
    ;(error as any).status = 401
    throw error
  }

  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { email: true },
  })

  if (!dbUser || !isEmailInAllowlist(dbUser.email)) {
    const error = new Error("FORBIDDEN")
    ;(error as any).status = 403
    throw error
  }

  return {
    userId: user.id,
    email: user.email ?? dbUser.email ?? "",
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
  }
}

/**
 * Alias for requireAdmin (platform admin)
 */
export async function requirePlatformAdmin(): Promise<{
  userId: string
  email: string
  name: string | null
}> {
  return requireAdmin()
}

/**
 * Get admin identity for audit logging
 * Returns null if not admin (non-throwing version)
 */
export async function getAdminIdentity(): Promise<{
  userId: string
  email: string
  name: string | null
} | null> {
  try {
    return await requireAdmin()
  } catch {
    return null
  }
}

// Type exports for better typing
export type AdminUser = Awaited<ReturnType<typeof requireAdmin>>
export type SuperAdminUser = Awaited<ReturnType<typeof requireSuperAdmin>>
