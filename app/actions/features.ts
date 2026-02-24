"use server"

import { requireSuperAdmin, requireAdmin, getAdminIdentity } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditReasonSchema } from "@/lib/validations/pricing"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"

/**
 * Update pricing package features (super admin only)
 */
export async function updatePricingPackageFeatures(
  packageId: string,
  features: Array<{
    featureId: string
    enabled: boolean
    valueJson?: any
  }>,
  reason: string
) {
  const actor = await requireSuperAdmin()
  const validatedReason = auditReasonSchema.parse({ reason }).reason

  const packageData = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!packageData || packageData.deletedAt) {
    throw new Error("Pricing package not found")
  }

  // Only allow editing DRAFT packages
  if (packageData.status !== "DRAFT") {
    throw new Error("Only DRAFT packages can have features updated")
  }

  const beforeJson = await prisma.pricingPackageFeature.findMany({
    where: { pricingPackageId: packageId },
  })

  // Upsert all features
  for (const feature of features) {
    await prisma.pricingPackageFeature.upsert({
      where: {
        pricingPackageId_featureId: {
          pricingPackageId: packageId,
          featureId: feature.featureId,
        },
      },
      update: {
        enabled: feature.enabled,
        valueJson: feature.valueJson ?? null,
      },
      create: {
        pricingPackageId: packageId,
        featureId: feature.featureId,
        enabled: feature.enabled,
        valueJson: feature.valueJson ?? null,
      },
    })
  }

  const afterJson = await prisma.pricingPackageFeature.findMany({
    where: { pricingPackageId: packageId },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_UPDATE",
    entityType: "PricingPackage",
    entityId: packageId,
    reason: validatedReason,
    beforeJson,
    afterJson,
    metadata: { featureCount: features.length },
  })

  revalidatePath("/admin/pricing")
  revalidatePath(`/admin/pricing/${packageId}/edit`)
  return { success: true }
}

/**
 * Get all features with package feature state
 */
export async function getPackageFeatures(packageId: string) {
  await requireSuperAdmin()

  const features = await prisma.feature.findMany({
    orderBy: { key: "asc" },
  })

  const packageFeatures = await prisma.pricingPackageFeature.findMany({
    where: { pricingPackageId: packageId },
    include: {
      feature: true,
    },
  })

  const packageFeatureMap = new Map(
    packageFeatures.map((pf) => [pf.featureId, pf])
  )

  return features.map((feature) => {
    const packageFeature = packageFeatureMap.get(feature.id)
    return {
      id: feature.id,
      key: feature.key,
      name: feature.name,
      description: feature.description,
      valueType: feature.valueType,
      enabled: packageFeature?.enabled ?? false,
      valueJson: packageFeature?.valueJson ?? null,
    }
  })
}

/**
 * Get merchant feature overrides
 */
export async function getMerchantFeatureOverrides(merchantId: string) {
  await requireAdmin()

  const overrides = await prisma.merchantFeatureOverride.findMany({
    where: { merchantId },
    include: {
      feature: true,
    },
    orderBy: { feature: { key: "asc" } },
  })

  return overrides.map((override) => ({
    id: override.id,
    featureId: override.featureId,
    featureKey: override.feature.key,
    featureName: override.feature.name,
    mode: override.mode,
    valueJson: override.valueJson,
    note: override.note,
    createdBy: override.createdBy,
    createdAt: override.createdAt,
  }))
}

/**
 * Get resolved features for merchant (admin view)
 */
export async function getMerchantResolvedFeatures(merchantId: string) {
  await requireAdmin()

  const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
  const features = await resolveMerchantFeatures(merchantId)

  const allFeatures = await prisma.feature.findMany({
    orderBy: { key: "asc" },
  })

  return allFeatures.map((feature) => {
    const resolved = features.get(feature.key as any)
    return {
      key: feature.key,
      name: feature.name,
      description: feature.description,
      enabled: resolved?.enabled ?? false,
      value: resolved?.value ?? null,
      source: resolved?.source ?? "default",
    }
  })
}

/**
 * Set merchant feature override (admin+)
 */
export async function setMerchantFeatureOverride(
  merchantId: string,
  featureId: string,
  mode: "ENABLE" | "DISABLE" | "OVERRIDE" | "NONE",
  valueJson?: any,
  note?: string
) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const reason = auditReasonSchema.parse({ reason: note || "Feature override" }).reason

  if (mode === "NONE") {
    // Delete override
    await prisma.merchantFeatureOverride.deleteMany({
      where: {
        merchantId,
        featureId,
      },
    })
  } else {
    // Upsert override
    await prisma.merchantFeatureOverride.upsert({
      where: {
        merchantId_featureId: {
          merchantId,
          featureId,
        },
      },
      update: {
        mode: mode as any,
        valueJson: valueJson ?? null,
        note: note || null,
        createdBy: actor.email || actor.userId,
      },
      create: {
        merchantId,
        featureId,
        mode: mode as any,
        valueJson: valueJson ?? null,
        note: note || null,
        createdBy: actor.email || actor.userId,
      },
    })
  }

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PACKAGE_UPDATE_OVERRIDES",
    entityType: "MerchantFeatureOverride",
    entityId: merchantId,
    reason,
    afterJson: { featureId, mode, valueJson },
  })

  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true }
}
