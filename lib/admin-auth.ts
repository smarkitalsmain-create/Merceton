import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createSupabaseServerReadonlyClient } from "@/lib/supabase/server-readonly"

function getAllowedAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function isAdminUser(userId: string): boolean {
  const allow = getAllowedAdminIds()
  if (allow.length === 0 && process.env.NODE_ENV === "development") {
    console.warn(
      "[admin-auth] ADMIN_USER_IDS is empty — allowing access in development only."
    )
    return true
  }
  return allow.includes(userId)
}

export type AdminActor = {
  userId: string
  email: string | null
}

/** Same gate as {@link requireSuperAdmin} — alias for admin pages that use the older name. */
export async function requirePlatformAdmin(): Promise<void> {
  await requireSuperAdmin()
}

/** @deprecated Use {@link requireSuperAdmin} — kept for older server actions. */
export async function requireAdmin(): Promise<void> {
  await requireSuperAdmin()
}

/**
 * Returns admin identity if the current user is allowed; otherwise `null`.
 * Used by server actions that accept either merchant or admin (e.g. tickets).
 */
export async function getAdminIdentity(): Promise<AdminActor | null> {
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  if (!isAdminUser(user.id)) return null
  return { userId: user.id, email: user.email ?? null }
}

/** For server actions that must run as admin only — throws on failure. */
export async function getAdminActorForAction(): Promise<AdminActor> {
  const admin = await getAdminIdentity()
  if (!admin) {
    throw new Error("Forbidden")
  }
  return admin
}

/**
 * Server pages / layouts for `/_admin/*` — redirects if not allowed.
 */
export async function requireSuperAdmin(): Promise<{ email: string | null; userId: string }> {
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/sign-in")
  }

  if (!isAdminUser(user.id)) {
    redirect("/")
  }

  return { email: user.email ?? null, userId: user.id }
}

/**
 * API routes — returns JSON error responses instead of redirects.
 */
export async function requireAdminForApi(): Promise<AdminActor | NextResponse> {
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return { userId: user.id, email: user.email ?? null }
}
