import { prisma } from "@/lib/prisma"

/**
 * Get merchant onboarding data (creates if missing)
 */
export async function getMerchantOnboarding(merchantId: string) {
  let onboarding = await prisma.merchantOnboarding.findUnique({
    where: { merchantId },
  })

  if (!onboarding) {
    onboarding = await prisma.merchantOnboarding.create({
      data: {
        merchantId,
        onboardingStatus: "NOT_STARTED",
      },
    })
  }

  return onboarding
}

/**
 * Calculate profile completion percentage
 */
export function calculateCompletionPercent(onboarding: {
  panNumber?: string | null
  gstStatus: string
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
 * Validate PAN number format
 */
export function validatePAN(pan: string): boolean {
  // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan.toUpperCase())
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  // GSTIN format: 15 alphanumeric characters
  // First 2: State code, Next 10: PAN, Next 1: Entity number, Next 1: Z by default, Last 1: Check digit
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin.toUpperCase())
}
