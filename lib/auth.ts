import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { createSupabaseServerReadonlyClient } from "@/lib/supabase/server-readonly"
import { isDbDownError, getDbErrorMessage } from "@/lib/db-error"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  return user
}

/**
 * Ensure a DB user exists for the logged-in Supabase user.
 * IMPORTANT:
 * - Does NOT require merchant
 * - Does NOT force merchant creation
 * - Keeps DB writes minimal (create only if missing)
 * - Handles DB connection errors gracefully
 */
export async function requireUser() {
  const authUser = await requireAuth()
  const userId = authUser.id

  const email = authUser.email ?? `${userId}@no-email.local`
  const name =
    (authUser.user_metadata?.name as string | undefined) ||
    (authUser.user_metadata?.full_name as string | undefined) ||
    null

  try {
    // Use upsert to atomically create or update user
    // This prevents unique constraint errors from race conditions
    const user = await prisma.user.upsert({
      where: { authUserId: userId },
      update: {
        email, // keep email synced
        name, // keep name synced
      },
      create: {
        authUserId: userId,
        email,
        name,
        role: "ADMIN",
        // merchantId intentionally not set here
      },
      include: { merchant: true },
    })
    
    // Log for debugging (only in dev)
    if (process.env.NODE_ENV === "development") {
      console.log(`[requireUser] User ${userId}: upsert succeeded`)
    }
    
    return user
  } catch (error: unknown) {
    // Handle unique constraint violation (P2002) - race condition fallback
    if (
      error instanceof Error &&
      (error as any)?.code === "P2002" &&
      (error as any)?.meta?.target?.includes("authUserId")
    ) {
      // Another request created the user concurrently, fetch it instead
      if (process.env.NODE_ENV === "development") {
        console.log(`[requireUser] User ${userId}: P2002 race condition, fetching existing user`)
      }
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: { authUserId: userId },
          include: { merchant: true },
        })
        
        if (existingUser) {
          // Update email/name if they changed (sync from auth)
          if (existingUser.email !== email || existingUser.name !== name) {
            return await prisma.user.update({
              where: { authUserId: userId },
              data: {
                email,
                name,
              },
              include: { merchant: true },
            })
          }
          return existingUser
        }
      } catch (fetchError) {
        // If fetch also fails due to DB error, handle it below
        if (isDbDownError(fetchError)) {
          console.error("[requireUser] DB connection error in fetch fallback:", fetchError)
          redirect("/503")
        }
      }
      
      // If user still doesn't exist after fetch, something is wrong
      console.error(`[requireUser] P2002 but user ${userId} not found after fetch`)
      throw new Error("Failed to create or find user")
    }
    
    // Check if it's a database connection error
    if (isDbDownError(error)) {
      console.error("[requireUser] DB connection error:", {
        error: error instanceof Error ? error.message : String(error),
        code: (error as any)?.errorCode || (error as any)?.code,
      })
      // Redirect to 503 page instead of throwing Response
      redirect("/503")
    }
    
    // Re-throw other errors (auth errors, etc.)
    console.error("Unexpected error in requireUser:", error)
    throw error
  }
}

/**
 * Require merchant - redirects to onboarding if user has no merchant
 * Use for dashboard routes that require a store
 * Handles DB connection errors gracefully
 */
export async function requireMerchant() {
  try {
    const user = await requireUser()
    if (!user.merchant) redirect("/onboarding/create-store")
    return user.merchant
  } catch (error: unknown) {
    // Check if it's a database connection error
    if (isDbDownError(error)) {
      console.error("[requireMerchant] DB connection error:", {
        error: error instanceof Error ? error.message : String(error),
        code: (error as any)?.errorCode || (error as any)?.code,
      })
      // Redirect to 503 page instead of throwing Response
      redirect("/503")
    }
    // Re-throw other errors (including redirects from requireUser)
    throw error
  }
}

/**
 * Require admin (role-based).
 * Ensures user has merchant and is ADMIN role.
 * If you later add STAFF users, this becomes useful.
 */
export async function requireAdmin() {
  const user = await requireUser()

  if (!user.merchant) {
    redirect("/onboarding/create-store")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return { user, merchant: user.merchant }
}

/**
 * Tenant isolation helper (server-side)
 */
export function ensureTenantAccess(
  merchantId: string | null | undefined,
  userMerchantId: string
) {
  if (!merchantId || merchantId !== userMerchantId) {
    throw new Error("Unauthorized: Access denied to this resource")
  }
}

/**
 * Authorization helper for API routes / server actions.
 * If resourceMerchantId is provided, checks tenant match.
 */
export async function authorizeRequest(resourceMerchantId?: string) {
  try {
    const user = await requireUser()

    if (!user.merchant) {
      throw new Error("Merchant not found")
    }

    if (resourceMerchantId && resourceMerchantId !== user.merchant.id) {
      throw new Error("Unauthorized: Access denied to this resource")
    }

    return { user, merchant: user.merchant }
  } catch (error: unknown) {
    // If requireUser redirected due to DB error, re-throw to propagate redirect
    // Otherwise check for DB errors here too
    if (isDbDownError(error)) {
      console.error("[authorizeRequest] DB connection error:", {
        error: error instanceof Error ? error.message : String(error),
        code: (error as any)?.errorCode || (error as any)?.code,
      })
      redirect("/503")
    }
    throw error
  }
}

/**
 * Get current merchant (nullable) - does not redirect
 * Returns null if user has no merchant
 */
export async function getCurrentMerchant() {
  try {
    const user = await requireUser()
    return user.merchant || null
  } catch {
    return null
  }
}
