"use server"

import { requireSuperAdmin, requireAdmin, getAdminIdentity } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"

const auditReasonSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
})

/**
 * Activate merchant (admin+)
 */
export async function activateMerchant(merchantId: string, reason: string) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const existing = await prisma.merchant.findUnique({
    where: { id: merchantId },
  })
  if (!existing) {
    throw new Error("Merchant not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive: true },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_ACTIVATE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Deactivate merchant (admin+)
 */
export async function deactivateMerchant(merchantId: string, reason: string) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const existing = await prisma.merchant.findUnique({
    where: { id: merchantId },
  })
  if (!existing) {
    throw new Error("Merchant not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive: false },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_DEACTIVATE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Set merchant holdback (admin+)
 */
export async function setMerchantHoldback(
  merchantId: string,
  holdbackBps: number | null,
  reason: string
) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const feeConfig = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
  })
  if (!feeConfig) {
    throw new Error("Merchant fee config not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = feeConfig

  const updated = await prisma.merchantFeeConfig.update({
    where: { merchantId },
    data: { holdbackOverrideBps: holdbackBps },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_HOLDBACK_SET",
    entityType: "MerchantFeeConfig",
    entityId: feeConfig.id,
    reason: validatedReason,
    beforeJson,
    afterJson: updated,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, feeConfig: updated }
}

/**
 * Set merchant payout hold (admin+)
 */
export async function setMerchantPayoutHold(
  merchantId: string,
  isPayoutHold: boolean,
  reason: string
) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const feeConfig = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
  })
  if (!feeConfig) {
    throw new Error("Merchant fee config not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = feeConfig

  const updated = await prisma.merchantFeeConfig.update({
    where: { merchantId },
    data: { isPayoutHoldOverride: isPayoutHold },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PAYOUT_HOLD_SET",
    entityType: "MerchantFeeConfig",
    entityId: feeConfig.id,
    reason: validatedReason,
    beforeJson,
    afterJson: updated,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, feeConfig: updated }
}

/**
 * Toggle merchant active status (super admin only)
 */
export async function toggleMerchantStatus(merchantId: string, isActive: boolean, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!existing) throw new Error("Merchant not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: isActive ? "MERCHANT_ACTIVATE" : "MERCHANT_DEACTIVATE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Update legacy merchant fee config fields (super admin only)
 * NOTE: Fee calculation uses pricing packages; these fields remain for backward compatibility.
 */
export async function updateMerchantFeeConfig(
  merchantId: string,
  input: {
    feePercentageBps: number | null
    feeFlatPaise: number | null
    feeMaxCapPaise: number | null
  },
  reason: string
) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!existing) throw new Error("Merchant not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      feePercentageBps: input.feePercentageBps,
      feeFlatPaise: input.feeFlatPaise,
      feeMaxCapPaise: input.feeMaxCapPaise,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PACKAGE_UPDATE_OVERRIDES",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Reset domain status and regenerate verification token (super admin only)
 */
export async function resetDomainStatus(merchantId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!existing) throw new Error("Merchant not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      domainStatus: "PENDING",
      domainVerificationToken: token,
      domainVerifiedAt: null,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_DOMAIN_SUBSCRIPTION_TOGGLE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/domains")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Mark domain verified (testing/ops) (super admin only)
 */
export async function markDomainVerified(merchantId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!existing) throw new Error("Merchant not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      domainStatus: "VERIFIED",
      domainVerifiedAt: new Date(),
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_DOMAIN_SUBSCRIPTION_TOGGLE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/domains")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Regenerate domain verification token (super admin only)
 */
export async function regenerateDomainToken(merchantId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!existing) throw new Error("Merchant not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      domainVerificationToken: token,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_DOMAIN_SUBSCRIPTION_TOGGLE",
    entityType: "Merchant",
    entityId: merchantId,
    reason: validatedReason,
    beforeJson,
    afterJson: merchant,
  })

  revalidatePath("/admin/domains")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, merchant }
}

/**
 * Update platform settings (super admin only)
 */
export async function updatePlatformSettings(
  input: {
    defaultFeePercentageBps: number | null
    defaultFeeFlatPaise: number | null
    defaultFeeMaxCapPaise: number | null
  },
  reason: string
) {
  const actor = await requireSuperAdmin()
  const validatedReason = auditReasonSchema.parse({ reason }).reason

  const existing = await prisma.platformSettings.findUnique({ where: { id: "singleton" } })
  const beforeJson = existing

  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {
      defaultFeePercentageBps: input.defaultFeePercentageBps,
      defaultFeeFlatPaise: input.defaultFeeFlatPaise,
      defaultFeeMaxCapPaise: input.defaultFeeMaxCapPaise,
    },
    create: {
      id: "singleton",
      defaultFeePercentageBps: input.defaultFeePercentageBps,
      defaultFeeFlatPaise: input.defaultFeeFlatPaise,
      defaultFeeMaxCapPaise: input.defaultFeeMaxCapPaise,
    },
  })

  const afterJson = await prisma.platformSettings.findUnique({ where: { id: "singleton" } })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PLATFORM_SETTINGS_UPDATE",
    entityType: "PlatformSettings",
    entityId: "singleton",
    reason: validatedReason,
    beforeJson,
    afterJson,
  })

  revalidatePath("/admin/settings")
  return { success: true }
}

/**
 * Toggle user active status (super admin only)
 */
export async function toggleUserStatus(userId: string, isActive: boolean, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw new Error("User not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "USER_TOGGLE_ACTIVE",
    entityType: "User",
    entityId: userId,
    reason: validatedReason,
    beforeJson,
    afterJson: user,
  })

  revalidatePath("/admin/users")
  return { success: true, user }
}

/**
 * Reassign user to merchant (super admin only)
 */
export async function reassignUserToMerchant(userId: string, merchantId: string | null, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw new Error("User not found")

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const user = await prisma.user.update({
    where: { id: userId },
    data: { merchantId },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "USER_REASSIGN_MERCHANT",
    entityType: "User",
    entityId: userId,
    reason: validatedReason,
    beforeJson,
    afterJson: user,
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/merchants")
  return { success: true, user }
}
