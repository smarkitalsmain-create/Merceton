/**
 * Onboarding Service
 * 
 * Centralized service layer for all onboarding Prisma operations.
 * Ensures:
 * - No direct Prisma calls in components
 * - Consistent error handling
 * - Proper upsert logic (minimal create, step-based updates)
 * - Profile completion calculation
 */

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type OnboardingStep = "pan" | "gst" | "invoice" | "business"

export interface OnboardingResult {
  success: true
  onboarding: {
    id: string
    onboardingStatus: string
    profileCompletionPercent: number | null
  }
}

export interface OnboardingError {
  success: false
  error: string
  fieldErrors?: Record<string, string>
}

export type OnboardingResponse = OnboardingResult | OnboardingError

/**
 * Get or create onboarding record
 * Creates minimal record with only merchantId + status
 * All step fields are optional and populated later
 */
export async function getOrCreateOnboarding(merchantId: string) {
  return await prisma.merchantOnboarding.upsert({
    where: { merchantId },
    update: {}, // No updates if exists
    create: {
      merchantId,
      onboardingStatus: "NOT_STARTED",
      profileCompletionPercent: 0,
      // All step fields are optional - omit on create
    },
  })
}

/**
 * Update onboarding step
 * Only updates fields relevant to the step
 * For business step, marks onboarding as COMPLETED
 */
export async function updateOnboardingStep(
  merchantId: string,
  step: OnboardingStep,
  data: Prisma.MerchantOnboardingUpdateInput
): Promise<OnboardingResponse> {
  try {
    // Get current onboarding
    const onboarding = await getOrCreateOnboarding(merchantId)

    // Calculate completion percent
    let profileCompletionPercent = calculateProfileCompletion({
      ...onboarding,
      ...data,
    } as any)

    // Determine onboarding status
    // If business step is being saved, mark as COMPLETED
    // Otherwise, set to IN_PROGRESS (if not already COMPLETED)
    let onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS"
    let completedAt: Date | null = null

    if (step === "business") {
      // Business step completion means onboarding is complete
      onboardingStatus = "COMPLETED"
      completedAt = new Date()
      // Ensure completion percent is 100
      profileCompletionPercent = 100
    } else if (onboarding.onboardingStatus === "COMPLETED") {
      // Don't downgrade from COMPLETED
      onboardingStatus = "COMPLETED"
      completedAt = onboarding.completedAt
    }

    // Update only relevant fields for this step
    const updated = await prisma.merchantOnboarding.update({
      where: { merchantId },
      data: {
        ...data,
        onboardingStatus,
        profileCompletionPercent,
        completedAt,
      },
    })

    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log(`[onboarding.service] Updated ${step} step:`, {
        onboardingStatus: updated.onboardingStatus,
        profileCompletionPercent: updated.profileCompletionPercent,
        completedAt: updated.completedAt,
      })
    }

    return {
      success: true,
      onboarding: {
        id: updated.id,
        onboardingStatus: updated.onboardingStatus,
        profileCompletionPercent: updated.profileCompletionPercent,
      },
    }
  } catch (error) {
    console.error(`[onboarding.service] Error updating ${step} step:`, error)
    return {
      success: false,
      error: "Failed to save onboarding data. Please try again.",
    }
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(merchantId: string): Promise<OnboardingResponse> {
  try {
    const onboarding = await getOrCreateOnboarding(merchantId)

    const updated = await prisma.merchantOnboarding.update({
      where: { merchantId },
      data: {
        onboardingStatus: "COMPLETED",
        completedAt: new Date(),
        profileCompletionPercent: 100,
      },
    })

    return {
      success: true,
      onboarding: {
        id: updated.id,
        onboardingStatus: updated.onboardingStatus,
        profileCompletionPercent: updated.profileCompletionPercent,
      },
    }
  } catch (error) {
    console.error("[onboarding.service] Error completing onboarding:", error)
    return {
      success: false,
      error: "Failed to complete onboarding. Please try again.",
    }
  }
}

/**
 * Calculate profile completion percentage
 * Based on completed steps: PAN, GST, Business Basics
 */
export function calculateProfileCompletion(onboarding: {
  panNumber?: string | null
  gstStatus?: string | null
  gstin?: string | null
  storeDisplayName?: string | null
  primaryCategory?: string | null
}): number {
  let completed = 0
  const total = 3 // PAN, GST, Business Basics

  // PAN completed
  if (onboarding.panNumber) {
    completed += 1
  }

  // GST completed (either registered with GSTIN or explicitly marked as not registered)
  if (onboarding.gstStatus === "REGISTERED" && onboarding.gstin) {
    completed += 1
  } else if (onboarding.gstStatus === "NOT_REGISTERED" || onboarding.gstStatus === "APPLIED") {
    completed += 1
  }

  // Business Basics completed
  if (onboarding.storeDisplayName && onboarding.primaryCategory) {
    completed += 1
  }

  return Math.round((completed / total) * 100)
}

/**
 * Get onboarding by merchant ID
 */
export async function getOnboardingByMerchantId(merchantId: string) {
  return await prisma.merchantOnboarding.findUnique({
    where: { merchantId },
  })
}
