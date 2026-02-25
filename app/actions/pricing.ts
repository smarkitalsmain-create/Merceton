"use server"

import { requireSuperAdmin, requireAdmin, getAdminIdentity } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  pricingPackageSchema,
  merchantFeeOverrideSchema,
  assignPackageSchema,
  auditReasonSchema,
} from "@/lib/validations/pricing"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"

/** Generate a unique package code from name (safe for UNIQUE constraint) */
function generatePackageCode(name: string, suffix?: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "pkg"
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now()}`
}

/**
 * Create pricing package (super admin only)
 * Always creates as DRAFT status
 */
export async function createPricingPackage(
  input: z.infer<typeof pricingPackageSchema> & { reason: string }
) {
  const actor = await requireSuperAdmin()
  const validated = pricingPackageSchema.parse(input)
  const reason = auditReasonSchema.parse({ reason: input.reason }).reason

  const packageData = await prisma.pricingPackage.create({
    data: {
      name: validated.name,
      code: generatePackageCode(validated.name),
      description: validated.description || null,
      status: "DRAFT", // Always create as DRAFT
      fixedFeePaise: validated.fixedFeePaise,
      variableFeeBps: validated.variableFeeBps,
      domainPricePaise: validated.domainPricePaise,
      domainAllowed: validated.domainAllowed,
      domainIncluded: validated.domainIncluded,
      payoutFrequency: validated.payoutFrequency,
      holdbackBps: validated.holdbackBps,
      isPayoutHold: validated.isPayoutHold,
      isActive: validated.isActive,
      visibility: validated.visibility,
    },
  })

  // Create audit log
  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_CREATE",
    entityType: "PricingPackage",
    entityId: packageData.id,
    reason,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  return { success: true, package: packageData }
}

/**
 * Update pricing package (super admin only)
 * Only allows editing DRAFT packages
 * For PUBLISHED packages, must duplicate and edit the new DRAFT
 */
export async function updatePricingPackage(
  packageId: string,
  input: z.infer<typeof pricingPackageSchema> & { reason: string }
) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  // Only allow editing DRAFT packages
  if (existing.status !== "DRAFT") {
    throw new Error(
      `Cannot edit ${existing.status} package. Only DRAFT packages can be edited. Use "Duplicate & Edit" to create a new DRAFT version.`
    )
  }

  const validated = pricingPackageSchema.parse(input)
  const reason = auditReasonSchema.parse({ reason: input.reason }).reason

  const beforeJson = existing

  const packageData = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: {
      name: validated.name,
      description: validated.description || null,
      // Keep status as DRAFT (cannot change via update)
      fixedFeePaise: validated.fixedFeePaise,
      variableFeeBps: validated.variableFeeBps,
      domainPricePaise: validated.domainPricePaise,
      domainAllowed: validated.domainAllowed,
      domainIncluded: validated.domainIncluded,
      payoutFrequency: validated.payoutFrequency,
      holdbackBps: validated.holdbackBps,
      isPayoutHold: validated.isPayoutHold,
      isActive: validated.isActive,
      visibility: validated.visibility,
    },
  })

  // Create audit log
  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_UPDATE",
    entityType: "PricingPackage",
    entityId: packageId,
    reason,
    beforeJson,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  revalidatePath(`/admin/pricing/${packageId}/edit`)
  return { success: true, package: packageData }
}

/**
 * Publish pricing package (DRAFT -> PUBLISHED) - super admin only
 */
export async function publishPricingPackage(packageId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  if (existing.status !== "DRAFT") {
    throw new Error(`Cannot publish ${existing.status} package. Only DRAFT packages can be published.`)
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const packageData = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { status: "PUBLISHED" },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_PUBLISH",
    entityType: "PricingPackage",
    entityId: packageId,
    reason: validatedReason,
    beforeJson,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  return { success: true, package: packageData }
}

/**
 * Archive pricing package (PUBLISHED -> ARCHIVED) - super admin only
 */
export async function archivePricingPackage(packageId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
    include: {
      merchantFeeConfigs: true,
    },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  if (existing.status !== "PUBLISHED") {
    throw new Error(`Cannot archive ${existing.status} package. Only PUBLISHED packages can be archived.`)
  }

  // Check if package is in use
  if (existing.merchantFeeConfigs.length > 0) {
    throw new Error(
      `Cannot archive package: ${existing.merchantFeeConfigs.length} merchant(s) are using it. Reassign them first.`
    )
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const packageData = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { status: "ARCHIVED", isActive: false },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_ARCHIVE",
    entityType: "PricingPackage",
    entityId: packageId,
    reason: validatedReason,
    beforeJson,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  return { success: true, package: packageData }
}

/**
 * Toggle pricing package active status (super admin only)
 */
export async function togglePricingPackageActive(
  packageId: string,
  isActive: boolean,
  reason: string
) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const packageData = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { isActive },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_TOGGLE_ACTIVE",
    entityType: "PricingPackage",
    entityId: packageId,
    reason: validatedReason,
    beforeJson,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  return { success: true, package: packageData }
}

/**
 * Soft delete pricing package (super admin only)
 * Prevents deletion if in use
 */
export async function deletePricingPackage(packageId: string, reason: string) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
    include: {
      merchantFeeConfigs: true,
    },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  // Check if package is in use
  if (existing.merchantFeeConfigs.length > 0) {
    throw new Error(
      `Cannot delete package: ${existing.merchantFeeConfigs.length} merchant(s) are using it`
    )
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  const packageData = await prisma.pricingPackage.update({
    where: { id: packageId },
    data: { deletedAt: new Date(), isActive: false },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_DELETE",
    entityType: "PricingPackage",
    entityId: packageId,
    reason: validatedReason,
    beforeJson,
    afterJson: packageData,
  })

  revalidatePath("/admin/pricing")
  return { success: true }
}

/**
 * Set default pricing package (super admin only)
 * Must be PUBLISHED and active
 */
export async function setDefaultPricingPackage(
  packageId: string,
  reason: string
) {
  const actor = await requireSuperAdmin()

  // Verify package exists, is PUBLISHED, and is active
  const packageData = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!packageData || packageData.deletedAt || !packageData.isActive) {
    throw new Error("Pricing package not found or inactive")
  }
  if (packageData.status !== "PUBLISHED") {
    throw new Error("Only PUBLISHED packages can be set as default")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason

  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  })

  const beforeJson = platformSettings

  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {
      defaultPricingPackageId: packageId,
    },
    create: {
      id: "singleton",
      defaultPricingPackageId: packageId,
    },
  })

  const afterSettings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PLATFORM_SETTINGS_UPDATE",
    entityType: "PlatformSettings",
    entityId: "singleton",
    reason: validatedReason,
    beforeJson,
    afterJson: afterSettings,
  })

  revalidatePath("/admin/pricing")
  revalidatePath("/admin/settings")
  return { success: true }
}

/**
 * Assign pricing package to merchant (admin+)
 * Only PUBLISHED packages can be assigned
 */
export async function assignMerchantPricingPackage(
  merchantId: string,
  input: z.infer<typeof assignPackageSchema>
) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const validated = assignPackageSchema.parse(input)

  // Verify package exists, is PUBLISHED, and is accessible
  const packageData = await prisma.pricingPackage.findUnique({
    where: { id: validated.pricingPackageId },
  })
  if (!packageData || packageData.deletedAt) {
    throw new Error("Pricing package not found")
  }
  if (packageData.status !== "PUBLISHED") {
    throw new Error("Only PUBLISHED packages can be assigned to merchants")
  }
  if (!packageData.isActive && packageData.visibility !== "INTERNAL") {
    throw new Error("Pricing package is not available")
  }

  // Get existing config
  const existing = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
  })

  const beforeJson = existing

  // Upsert merchant fee config
  const feeConfig = await prisma.merchantFeeConfig.upsert({
    where: { merchantId },
    update: {
      pricingPackageId: validated.pricingPackageId,
      // Reset domain subscription if package doesn't include it
      domainSubscriptionActive:
        packageData.domainIncluded || (existing?.domainSubscriptionActive ?? false),
      domainIncludedApplied: packageData.domainIncluded,
    },
    create: {
      merchantId,
      pricingPackageId: validated.pricingPackageId,
      domainSubscriptionActive: packageData.domainIncluded,
      domainIncludedApplied: packageData.domainIncluded,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PACKAGE_ASSIGN",
    entityType: "MerchantFeeConfig",
    entityId: feeConfig.id,
    reason: validated.reason,
    beforeJson,
    afterJson: feeConfig,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, feeConfig }
}

/**
 * Update merchant fee overrides (admin+)
 */
export async function updateMerchantFeeOverrides(
  merchantId: string,
  input: z.infer<typeof merchantFeeOverrideSchema> & { reason: string }
) {
  await requireAdmin()
  const actor = await getAdminIdentity()
  if (!actor) {
    throw new Error("Admin identity not found")
  }

  const validated = merchantFeeOverrideSchema.parse(input)
  const reason = auditReasonSchema.parse({ reason: input.reason }).reason

  const existing = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
  })
  if (!existing) {
    throw new Error("Merchant fee config not found")
  }

  const beforeJson = existing

  const feeConfig = await prisma.merchantFeeConfig.update({
    where: { merchantId },
    data: {
      fixedFeeOverridePaise: validated.fixedFeeOverridePaise ?? null,
      variableFeeOverrideBps: validated.variableFeeOverrideBps ?? null,
      payoutFrequencyOverride: validated.payoutFrequencyOverride ?? null,
      holdbackOverrideBps: validated.holdbackOverrideBps ?? null,
      isPayoutHoldOverride: validated.isPayoutHoldOverride ?? null,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PACKAGE_UPDATE_OVERRIDES",
    entityType: "MerchantFeeConfig",
    entityId: feeConfig.id,
    reason,
    beforeJson,
    afterJson: feeConfig,
  })

  revalidatePath("/admin/merchants")
  revalidatePath(`/admin/merchants/${merchantId}`)
  return { success: true, feeConfig }
}

/**
 * Duplicate pricing package (super admin only)
 * Creates a new DRAFT copy of an existing package
 */
export async function duplicatePricingPackage(
  packageId: string,
  reason: string
) {
  const actor = await requireSuperAdmin()

  const existing = await prisma.pricingPackage.findUnique({
    where: { id: packageId },
  })
  if (!existing || existing.deletedAt) {
    throw new Error("Pricing package not found")
  }

  const validatedReason = auditReasonSchema.parse({ reason }).reason
  const beforeJson = existing

  // Create new DRAFT copy
  const newPackage = await prisma.pricingPackage.create({
    data: {
      name: `${existing.name} (Copy)`,
      code: generatePackageCode(existing.name, "copy"),
      description: existing.description,
      status: "DRAFT",
      fixedFeePaise: existing.fixedFeePaise,
      variableFeeBps: existing.variableFeeBps,
      domainPricePaise: existing.domainPricePaise,
      domainAllowed: existing.domainAllowed,
      domainIncluded: existing.domainIncluded,
      payoutFrequency: existing.payoutFrequency,
      holdbackBps: existing.holdbackBps,
      isPayoutHold: existing.isPayoutHold,
      isActive: existing.isActive,
      visibility: existing.visibility,
    },
  })

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_DUPLICATE",
    entityType: "PricingPackage",
    entityId: newPackage.id,
    reason: validatedReason,
    beforeJson,
    afterJson: newPackage,
    metadata: { sourcePackageId: packageId },
  })

  revalidatePath("/admin/pricing")
  return { success: true, package: newPackage }
}

// Merchant pricing selection removed - merchants cannot change plans
// Plan assignment is done by Super Admin only
