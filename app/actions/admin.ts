"use server"

import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Toggle merchant active status
 */
export async function toggleMerchantStatus(merchantId: string, isActive: boolean) {
  await requireAdmin()

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive },
  })

  revalidatePath("/admin")
  return { success: true, merchant }
}

/**
 * Update merchant fee configuration
 */
export async function updateMerchantFeeConfig(
  merchantId: string,
  config: {
    feePercentageBps?: number | null
    feeFlatPaise?: number | null
    feeMaxCapPaise?: number | null
  }
) {
  await requireAdmin()

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      feePercentageBps: config.feePercentageBps ?? null,
      feeFlatPaise: config.feeFlatPaise ?? null,
      feeMaxCapPaise: config.feeMaxCapPaise ?? null,
    },
  })

  revalidatePath("/admin")
  return { success: true, merchant }
}
