"use server"

import { requireAdmin, getAdminIdentity } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logAdminAction } from "@/lib/admin/audit"
import {
  sendMerchantOnHoldEmail,
  sendMerchantKycApprovedEmail,
  sendMerchantHoldReleasedEmail,
} from "@/lib/email/notifications"
import { MerchantAccountStatus, MerchantKycStatus } from "@prisma/client"
import { HOLD_REASON_CODES } from "@/lib/merchant/holdReasons"

const updateMerchantStatusSchema = z.object({
  merchantId: z.string().min(1),
  accountStatus: z.enum(["ACTIVE", "ON_HOLD"]).optional(),
  kycStatus: z.enum(["PENDING", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  holdReasonCode: z
    .enum(HOLD_REASON_CODES as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  holdReasonText: z.string().optional().nullable(),
  reason: z.string().min(1, "Reason is required for audit logging"),
})

/**
 * Unified merchant status update action
 * Handles account status, KYC status, and hold reasons
 * Sends email notifications and logs history
 */
export async function updateMerchantStatus(
  input: z.infer<typeof updateMerchantStatusSchema>
) {
  const actor = await requireAdmin()

  const validated = updateMerchantStatusSchema.parse(input)

  // Get current merchant state
  const merchant = await prisma.merchant.findUnique({
    where: { id: validated.merchantId },
    include: {
      users: {
        where: { role: "ADMIN" },
        take: 1,
      },
    },
  })

  if (!merchant) {
    throw new Error("Merchant not found")
  }

  const fromAccountStatus = merchant.accountStatus
  const fromKycStatus = merchant.kycStatus

  // Determine new statuses
  const toAccountStatus = validated.accountStatus ?? merchant.accountStatus
  const toKycStatus = validated.kycStatus ?? merchant.kycStatus

  // Determine if we need to send emails
  const shouldSendOnHoldEmail =
    fromAccountStatus !== "ON_HOLD" && toAccountStatus === "ON_HOLD"
  const shouldSendHoldReleasedEmail =
    fromAccountStatus === "ON_HOLD" && toAccountStatus === "ACTIVE"
  const shouldSendKycApprovedEmail =
    fromKycStatus !== "APPROVED" && toKycStatus === "APPROVED"

  // Validate hold reason is provided when setting ON_HOLD
  if (toAccountStatus === "ON_HOLD" && !validated.holdReasonCode) {
    throw new Error("Hold reason code is required when setting account to ON_HOLD")
  }

  // Prepare update data
  const updateData: any = {}

  if (validated.accountStatus !== undefined) {
    updateData.accountStatus = validated.accountStatus

    if (validated.accountStatus === "ON_HOLD") {
      updateData.holdReasonCode = validated.holdReasonCode
      updateData.holdReasonText = validated.holdReasonText
      updateData.holdAppliedAt = new Date()
      updateData.holdAppliedByUserId = actor.userId
      updateData.holdReleasedAt = null
      updateData.holdReleasedByUserId = null
    } else if (validated.accountStatus === "ACTIVE" && fromAccountStatus === "ON_HOLD") {
      // Releasing hold
      updateData.holdReasonCode = null
      updateData.holdReasonText = null
      updateData.holdReleasedAt = new Date()
      updateData.holdReleasedByUserId = actor.userId
    }
  }

  if (validated.kycStatus !== undefined) {
    updateData.kycStatus = validated.kycStatus

    if (validated.kycStatus === "APPROVED") {
      updateData.kycApprovedAt = new Date()
      updateData.kycApprovedByUserId = actor.userId
    }
  }

  // Update merchant and create history in a transaction
  const [updatedMerchant, statusHistory] = await prisma.$transaction(async (tx) => {
    // Update merchant
    const updated = await tx.merchant.update({
      where: { id: validated.merchantId },
      data: updateData,
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    })

    // Create status history entry
    const history = await tx.merchantStatusHistory.create({
      data: {
        merchantId: validated.merchantId,
        fromAccountStatus: fromAccountStatus,
        toAccountStatus: toAccountStatus,
        fromKycStatus: fromKycStatus,
        toKycStatus: toKycStatus,
        reason: validated.holdReasonCode || validated.reason,
        reasonText: validated.holdReasonText,
        changedByAdminUserId: actor.userId,
      },
    })

    return [updated, history]
  })

  // Log admin action
  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_STATUS_UPDATE",
    entityType: "Merchant",
    entityId: validated.merchantId,
    reason: validated.reason,
    beforeJson: {
      accountStatus: fromAccountStatus,
      kycStatus: fromKycStatus,
    },
    afterJson: {
      accountStatus: toAccountStatus,
      kycStatus: toKycStatus,
      holdReasonCode: validated.holdReasonCode,
    },
  })

  // Send email notifications after DB commit
  // Use the first admin user's email if available
  const merchantEmail = updatedMerchant.users[0]?.email
  const merchantName = updatedMerchant.displayName

  if (merchantEmail) {
    // Send emails asynchronously (don't block response)
    Promise.all([
      shouldSendOnHoldEmail &&
        sendMerchantOnHoldEmail({
          to: merchantEmail,
          merchantName,
          reasonCode: validated.holdReasonCode!,
          reasonText: validated.holdReasonText,
        }).catch((err) => {
          console.error("Failed to send on-hold email:", err)
        }),
      shouldSendHoldReleasedEmail &&
        sendMerchantHoldReleasedEmail({
          to: merchantEmail,
          merchantName,
        }).catch((err) => {
          console.error("Failed to send hold-released email:", err)
        }),
      shouldSendKycApprovedEmail &&
        sendMerchantKycApprovedEmail({
          to: merchantEmail,
          merchantName,
        }).catch((err) => {
          console.error("Failed to send KYC-approved email:", err)
        }),
    ]).catch((err) => {
      console.error("Error sending status change emails:", err)
    })
  }

  // Revalidate paths
  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${validated.merchantId}`)
  revalidatePath("/dashboard")

  return {
    success: true,
    merchant: updatedMerchant,
    statusHistory,
    emailsSent: {
      onHold: shouldSendOnHoldEmail,
      holdReleased: shouldSendHoldReleasedEmail,
      kycApproved: shouldSendKycApprovedEmail,
    },
  }
}

/**
 * Get merchant status history
 */
export async function getMerchantStatusHistory(merchantId: string) {
  await requireAdmin()

  return prisma.merchantStatusHistory.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  })
}
