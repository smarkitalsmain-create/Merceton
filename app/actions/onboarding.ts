"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMerchantOnboarding, calculateCompletionPercent } from "@/lib/onboarding"
import {
  panStepSchema,
  gstStepSchema,
  businessBasicsStepSchema,
  type PanStepData,
  type GstStepData,
  type BusinessBasicsStepData,
} from "@/lib/validations/onboarding"

/**
 * Save PAN step data
 */
export async function savePanStep(data: PanStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = panStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: {
        panType: validated.panType,
        panNumber: validated.panNumber.toUpperCase(),
        panName: validated.panName,
        panDobOrIncorp: validated.panDobOrIncorp,
        panHolderRole: validated.panHolderRole,
        onboardingStatus: "IN_PROGRESS",
        profileCompletionPercent: calculateCompletionPercent({
          ...onboarding,
          panNumber: validated.panNumber,
        }),
      },
    })

    revalidatePath("/dashboard/onboarding")
    return { success: true, onboarding: updated }
  } catch (error) {
    console.error("Save PAN step error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to save PAN details" }
  }
}

/**
 * Save GST step data
 */
export async function saveGstStep(data: GstStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = gstStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)

    const updateData: any = {
      gstStatus: validated.gstStatus,
      gstComposition: validated.gstComposition,
      onboardingStatus: "IN_PROGRESS",
    }

    if (validated.gstStatus === "REGISTERED") {
      updateData.gstin = validated.gstin?.toUpperCase()
      updateData.gstLegalName = validated.gstLegalName
      updateData.gstTradeName = validated.gstTradeName
      updateData.gstState = validated.gstState
    } else if (validated.gstStatus === "NOT_REGISTERED") {
      updateData.gstNotRegisteredReason = validated.gstNotRegisteredReason
    }

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: {
        ...updateData,
        profileCompletionPercent: calculateCompletionPercent({
          ...onboarding,
          gstStatus: validated.gstStatus,
          gstin: validated.gstin,
        }),
      },
    })

    revalidatePath("/dashboard/onboarding")
    return { success: true, onboarding: updated }
  } catch (error) {
    console.error("Save GST step error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to save GST details" }
  }
}

/**
 * Save Business Basics step and complete onboarding
 */
export async function saveBusinessBasicsStep(data: BusinessBasicsStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = businessBasicsStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: {
        storeDisplayName: validated.storeDisplayName,
        legalBusinessName: validated.legalBusinessName,
        yearStarted: validated.yearStarted,
        businessType: validated.businessType,
        primaryCategory: validated.primaryCategory,
        secondaryCategory: validated.secondaryCategory,
        avgPriceRange: validated.avgPriceRange,
        expectedSkuRange: validated.expectedSkuRange,
        onboardingStatus: "COMPLETED",
        completedAt: new Date(),
        profileCompletionPercent: 100,
      },
    })

    revalidatePath("/dashboard/onboarding")
    revalidatePath("/dashboard")
    return { success: true, onboarding: updated }
  } catch (error) {
    console.error("Save Business Basics step error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to save business details" }
  }
}

/**
 * Update PAN section from settings page
 * - Locks PAN number after onboarding completion or if orders exist
 */
export async function updateOnboardingPan(data: PanStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = panStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)
    const orderCount = await prisma.order.count({
      where: { merchantId: merchant.id },
    })
    const hasOrders = orderCount > 0

    const canEditPanNumber = onboarding.onboardingStatus !== "COMPLETED" && !hasOrders

    const updateData: any = {
      panType: validated.panType,
      panName: validated.panName,
      panDobOrIncorp: validated.panDobOrIncorp,
      panHolderRole: validated.panHolderRole,
    }

    if (canEditPanNumber) {
      updateData.panNumber = validated.panNumber.toUpperCase()
    }

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: updateData,
    })

    revalidatePath("/dashboard/settings/onboarding")
    revalidatePath("/dashboard/onboarding")
    return { success: true, onboarding: updated, hasOrders, canEditPanNumber }
  } catch (error) {
    console.error("Update PAN section error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to update PAN details" }
  }
}

/**
 * Update GST section from settings page
 * - Locks GSTIN edits if orders exist
 */
export async function updateOnboardingGst(data: GstStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = gstStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)
    const orderCount = await prisma.order.count({
      where: { merchantId: merchant.id },
    })
    const hasOrders = orderCount > 0

    const updateData: any = {
      gstStatus: validated.gstStatus,
      gstComposition: validated.gstComposition,
    }

    // Only allow GSTIN changes if not REGISTERED with existing orders
    const canEditGstin = !(validated.gstStatus === "REGISTERED" && hasOrders)

    if (validated.gstStatus === "REGISTERED") {
      if (canEditGstin) {
        updateData.gstin = validated.gstin?.toUpperCase()
      }
      updateData.gstLegalName = validated.gstLegalName
      updateData.gstTradeName = validated.gstTradeName
      updateData.gstState = validated.gstState
    } else if (validated.gstStatus === "NOT_REGISTERED") {
      updateData.gstNotRegisteredReason = validated.gstNotRegisteredReason
      if (canEditGstin) {
        updateData.gstin = null
        updateData.gstLegalName = null
        updateData.gstTradeName = null
        updateData.gstState = null
      }
    }

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: updateData,
    })

    revalidatePath("/dashboard/settings/onboarding")
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard/products/new")
    return { success: true, onboarding: updated, hasOrders, canEditGstin }
  } catch (error) {
    console.error("Update GST section error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to update GST details" }
  }
}

/**
 * Update Business Basics section from settings page
 */
export async function updateOnboardingBusiness(data: BusinessBasicsStepData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = businessBasicsStepSchema.parse(data)

    const onboarding = await getMerchantOnboarding(merchant.id)

    const updated = await prisma.merchantOnboarding.update({
      where: { id: onboarding.id },
      data: {
        storeDisplayName: validated.storeDisplayName,
        legalBusinessName: validated.legalBusinessName,
        yearStarted: validated.yearStarted,
        businessType: validated.businessType,
        primaryCategory: validated.primaryCategory,
        secondaryCategory: validated.secondaryCategory,
        avgPriceRange: validated.avgPriceRange,
        expectedSkuRange: validated.expectedSkuRange,
      },
    })

    revalidatePath("/dashboard/settings/onboarding")
    revalidatePath("/dashboard")
    return { success: true, onboarding: updated }
  } catch (error) {
    console.error("Update Business section error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to update business details" }
  }
}
