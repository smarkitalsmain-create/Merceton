"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAdminActorForAction } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/admin/audit"

type ActionResult = { success: true } | { success: false; error: string }

async function audit(actor: { userId: string; email: string | null }, action: string, entityId: string, reason: string, before?: unknown, after?: unknown) {
  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: action,
    entityType: "PricingPackage",
    entityId,
    reason,
    beforeJson: before as any,
    afterJson: after as any,
  })
}

export async function publishPricingPackage(packageId: string, reason: string): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.pricingPackage.findUnique({ where: { id: packageId } })
    if (!before || before.deletedAt) return { success: false, error: "Package not found" }
    const updated = await prisma.pricingPackage.update({
      where: { id: packageId },
      data: { status: "PUBLISHED" },
    })
    await audit(actor, "PRICING_PACKAGE_PUBLISH", packageId, reason, before, updated)
    revalidatePath("/admin/pricing-packages")
    revalidatePath("/_admin/pricing-packages")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function archivePricingPackage(packageId: string, reason: string): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.pricingPackage.findUnique({ where: { id: packageId } })
    if (!before || before.deletedAt) return { success: false, error: "Package not found" }
    const updated = await prisma.pricingPackage.update({
      where: { id: packageId },
      data: { status: "ARCHIVED", isActive: false },
    })
    await audit(actor, "PRICING_PACKAGE_ARCHIVE", packageId, reason, before, updated)
    revalidatePath("/admin/pricing-packages")
    revalidatePath("/_admin/pricing-packages")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function togglePricingPackageActive(
  packageId: string,
  isActive: boolean,
  reason: string
): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.pricingPackage.findUnique({ where: { id: packageId } })
    if (!before || before.deletedAt) return { success: false, error: "Package not found" }
    const updated = await prisma.pricingPackage.update({
      where: { id: packageId },
      data: { isActive },
    })
    await audit(actor, "PRICING_PACKAGE_TOGGLE_ACTIVE", packageId, reason, before, updated)
    revalidatePath("/admin/pricing-packages")
    revalidatePath("/_admin/pricing-packages")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function deletePricingPackage(packageId: string, reason: string): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.pricingPackage.findUnique({ where: { id: packageId } })
    if (!before || before.deletedAt) return { success: false, error: "Package not found" }
    const updated = await prisma.pricingPackage.update({
      where: { id: packageId },
      data: { deletedAt: new Date(), isActive: false, status: "ARCHIVED" },
    })
    await audit(actor, "PRICING_PACKAGE_DELETE", packageId, reason, before, updated)
    revalidatePath("/admin/pricing-packages")
    revalidatePath("/_admin/pricing-packages")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function setDefaultPricingPackage(packageId: string, reason: string): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const pkg = await prisma.pricingPackage.findFirst({
      where: { id: packageId, deletedAt: null },
    })
    if (!pkg) return { success: false, error: "Package not found" }
    const before = await prisma.platformSettings.findUnique({ where: { id: "singleton" } })
    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        defaultPricingPackageId: packageId,
      },
      update: { defaultPricingPackageId: packageId },
    })
    await audit(actor, "PLATFORM_DEFAULT_PRICING_PACKAGE", packageId, reason, before, { defaultPricingPackageId: packageId })
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function duplicatePricingPackage(
  packageId: string,
  reason: string
): Promise<{ success: true; package: { id: string } } | { success: false; error: string }> {
  try {
    const actor = await getAdminActorForAction()
    const src = await prisma.pricingPackage.findFirst({
      where: { id: packageId, deletedAt: null },
    })
    if (!src) return { success: false, error: "Package not found" }

    const copy = await prisma.pricingPackage.create({
      data: {
        name: `${src.name} (copy)`,
        code: `${src.code}-copy-${Date.now()}`,
        description: src.description,
        status: "DRAFT",
        fixedFeePaise: src.fixedFeePaise,
        variableFeeBps: src.variableFeeBps,
        domainPricePaise: src.domainPricePaise,
        domainAllowed: src.domainAllowed,
        domainIncluded: src.domainIncluded,
        payoutFrequency: src.payoutFrequency,
        holdbackBps: src.holdbackBps,
        isPayoutHold: src.isPayoutHold,
        isActive: false,
        visibility: src.visibility,
      },
    })
    await audit(actor, "PRICING_PACKAGE_DUPLICATE", copy.id, reason, { sourceId: packageId }, copy)
    revalidatePath("/admin/pricing-packages")
    revalidatePath("/_admin/pricing-packages")
    return { success: true, package: { id: copy.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function assignMerchantPricingPackage(
  merchantId: string,
  input: { pricingPackageId: string; reason: string }
): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.merchantFeeConfig.findUnique({ where: { merchantId } })
    const updated = await prisma.merchantFeeConfig.upsert({
      where: { merchantId },
      create: {
        merchantId,
        pricingPackageId: input.pricingPackageId,
      },
      update: {
        pricingPackageId: input.pricingPackageId,
      },
    })
    await logAdminAction({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actionType: "MERCHANT_PRICING_PACKAGE_ASSIGN",
      entityType: "Merchant",
      entityId: merchantId,
      reason: input.reason,
      beforeJson: before,
      afterJson: updated,
    })
    revalidatePath(`/_admin/merchants/${merchantId}`)
    revalidatePath(`/admin/merchants/${merchantId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export async function updateMerchantFeeOverrides(
  merchantId: string,
  input: {
    fixedFeeOverridePaise: number | null
    variableFeeOverrideBps: number | null
    payoutFrequencyOverride: "WEEKLY" | "DAILY" | "MANUAL" | null
    holdbackOverrideBps: number | null
    isPayoutHoldOverride: boolean | null
    reason: string
  }
): Promise<ActionResult> {
  try {
    const actor = await getAdminActorForAction()
    const before = await prisma.merchantFeeConfig.findUnique({ where: { merchantId } })
    const updated = await prisma.merchantFeeConfig.upsert({
      where: { merchantId },
      create: {
        merchantId,
        fixedFeeOverridePaise: input.fixedFeeOverridePaise,
        variableFeeOverrideBps: input.variableFeeOverrideBps,
        payoutFrequencyOverride: input.payoutFrequencyOverride,
        holdbackOverrideBps: input.holdbackOverrideBps,
        isPayoutHoldOverride: input.isPayoutHoldOverride,
      },
      update: {
        fixedFeeOverridePaise: input.fixedFeeOverridePaise,
        variableFeeOverrideBps: input.variableFeeOverrideBps,
        payoutFrequencyOverride: input.payoutFrequencyOverride,
        holdbackOverrideBps: input.holdbackOverrideBps,
        isPayoutHoldOverride: input.isPayoutHoldOverride,
      },
    })
    await logAdminAction({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actionType: "MERCHANT_FEE_OVERRIDE_UPDATE",
      entityType: "MerchantFeeConfig",
      entityId: merchantId,
      reason: input.reason,
      beforeJson: before,
      afterJson: updated,
    })
    revalidatePath(`/_admin/merchants/${merchantId}`)
    revalidatePath(`/admin/merchants/${merchantId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" }
  }
}
