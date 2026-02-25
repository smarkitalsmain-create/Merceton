import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
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
 * Allows Supabase-authenticated users whose email is in allowlist even without a User row.
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

  const email = (user.email ?? "").trim().toLowerCase()
  if (!email) {
    const error = new Error("FORBIDDEN")
    ;(error as any).status = 403
    throw error
  }

  // Allow if email is in super admin allowlist (works for Supabase-only admins)
  if (isEmailInAllowlist(email)) {
    return {
      userId: user.id,
      email: user.email ?? email,
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
    }
  }

  // Fallback: check User table (for backwards compatibility)
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { email: true },
  })
  if (dbUser && isEmailInAllowlist(dbUser.email)) {
    return {
      userId: user.id,
      email: user.email ?? dbUser.email ?? "",
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
    }
  }

  const error = new Error("FORBIDDEN")
  ;(error as any).status = 403
  throw error
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

/**
 * Require admin for API routes. Returns NextResponse (401/403) on auth failure so route can return it.
 * Response body includes error and errorCode ("UNAUTHORIZED" | "FORBIDDEN") for client handling.
 */
export async function requireAdminForApi(): Promise<
  { userId: string; email: string; name: string | null } | NextResponse
> {
  try {
    return await requireAdmin()
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 500
    const message = e instanceof Error ? e.message : "Unauthorized"
    const errorCode = status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "SERVER_ERROR"
    return NextResponse.json({ error: message, errorCode }, { status })
  }
}

// Type exports for better typing
export type AdminUser = Awaited<ReturnType<typeof requireAdmin>>
export type SuperAdminUser = Awaited<ReturnType<typeof requireSuperAdmin>>
