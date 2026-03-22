"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAdminActorForAction } from "@/lib/admin-auth"

/**
 * Admin: set or clear a merchant feature override.
 */
export async function setMerchantFeatureOverride(
  merchantId: string,
  featureId: string,
  mode: "NONE" | "ENABLE" | "DISABLE",
  _config: unknown,
  reason: string
) {
  const actor = await getAdminActorForAction()
  const createdBy = actor.email || actor.userId

  if (mode === "NONE") {
    await prisma.merchantFeatureOverride.deleteMany({
      where: { merchantId, featureId },
    })
  } else {
    await prisma.merchantFeatureOverride.upsert({
      where: {
        merchantId_featureId: { merchantId, featureId },
      },
      update: {
        mode,
        note: reason,
        createdBy,
      },
      create: {
        merchantId,
        featureId,
        mode,
        note: reason,
        createdBy,
      },
    })
  }

  revalidatePath(`/_admin/merchants/${merchantId}`)
  revalidatePath(`/admin/merchants/${merchantId}`)
}
