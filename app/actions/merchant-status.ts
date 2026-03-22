"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAdminActorForAction } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/admin/audit"
import type { MerchantAccountStatus, MerchantKycStatus } from "@prisma/client"

export async function updateMerchantStatus(input: {
  merchantId: string
  accountStatus?: MerchantAccountStatus
  kycStatus?: MerchantKycStatus
  holdReasonCode?: string | null
  holdReasonText?: string | null
  reason: string
}): Promise<{ success: boolean }> {
  const actor = await getAdminActorForAction()
  const before = await prisma.merchant.findUnique({ where: { id: input.merchantId } })
  if (!before) return { success: false }

  const data: Record<string, unknown> = {}
  if (input.accountStatus !== undefined) {
    data.accountStatus = input.accountStatus
    if (input.accountStatus === "ON_HOLD") {
      data.holdReasonCode = input.holdReasonCode
      data.holdReasonText = input.holdReasonText
      data.holdAppliedAt = new Date()
      data.holdAppliedByUserId = actor.userId
    } else {
      data.holdReasonCode = null
      data.holdReasonText = null
      data.holdAppliedAt = null
      data.holdAppliedByUserId = null
    }
  }
  if (input.kycStatus !== undefined) {
    data.kycStatus = input.kycStatus
  }

  const updated = await prisma.merchant.update({
    where: { id: input.merchantId },
    data: data as any,
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_STATUS_UPDATE",
    entityType: "Merchant",
    entityId: input.merchantId,
    reason: input.reason,
    beforeJson: before,
    afterJson: updated,
  })

  revalidatePath(`/_admin/merchants/${input.merchantId}`)
  revalidatePath(`/admin/merchants/${input.merchantId}`)
  return { success: true }
}
