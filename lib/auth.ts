import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

/**
 * Require authentication (Clerk) - redirects if not authenticated
 */
export async function requireAuth() {
  const { userId } = auth()
  if (!userId) redirect("/sign-in")
  return userId
}

/**
 * Ensure a DB user exists for the logged-in Clerk user.
 * IMPORTANT:
 * - Does NOT require merchant
 * - Does NOT force merchant creation
 * - Keeps DB writes minimal (create only if missing)
 */
export async function requireUser() {
  const userId = await requireAuth()

  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ?? `${userId}@no-email.local`

  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null

  // 1) Try read first (avoid writes on every request)
  const existing = await prisma.user.findUnique({
    where: { authUserId: userId },
    include: { merchant: true },
  })

  // 2) Create if missing
  if (!existing) {
    return prisma.user.create({
      data: {
        authUserId: userId,
        email,
        name,
        role: "ADMIN",
        // merchantId intentionally not set here
      },
      include: { merchant: true },
    })
  }

  // 3) Optional: keep email/name in sync without forcing write every time
  const needsUpdate = existing.email !== email || existing.name !== name
  if (needsUpdate) {
    return prisma.user.update({
      where: { authUserId: userId },
      data: { email, name },
      include: { merchant: true },
    })
  }

  return existing
}

/**
 * Require merchant - redirects to onboarding if user has no merchant
 * Use for dashboard routes that require a store
 */
export async function requireMerchant() {
  const user = await requireUser()
  if (!user.merchant) redirect("/onboarding/create-store")
  return user.merchant
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
  const user = await requireUser()

  if (!user.merchant) {
    throw new Error("Merchant not found")
  }

  if (resourceMerchantId && resourceMerchantId !== user.merchant.id) {
    throw new Error("Unauthorized: Access denied to this resource")
  }

  return { user, merchant: user.merchant }
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
