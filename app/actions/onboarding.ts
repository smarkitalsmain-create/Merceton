"use server"

import { revalidatePath } from "next/cache"
import { authorizeRequest } from "@/lib/auth"
import {
  getOrCreateOnboarding,
  updateOnboardingStep,
  completeOnboarding,
  type OnboardingResponse,
} from "@/lib/services/onboarding.service"

// Re-export for use in components
export type { OnboardingResponse } from "@/lib/services/onboarding.service"
import {
  panStepSchema,
  panStepSchemaBase,
  gstStepSchema,
  gstStepSchemaBase,
  invoiceStepSchema,
  businessStepSchema,
  normalizeInvoicePayload,
} from "@/lib/validation/onboarding-steps"
import {
  validatePan4thChar,
  getPanTypeMismatchMessage,
  validateGstContainsPan,
  getGstPanMismatchMessage,
  type PanType,
} from "@/lib/validation/panRules"
import {
  isAge18Plus,
  getAgeValidationErrorMessage,
} from "@/lib/validation/ageValidation"
import { toSafeApiError } from "@/lib/api/error"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * Discriminated union for step-based validation
 * Each step uses its respective schema
 * Note: We validate PAN 4th char and GST/PAN match server-side after parsing
 */
const onboardingStepSchema = z.discriminatedUnion("step", [
  panStepSchemaBase.extend({ step: z.literal("pan") }),
  gstStepSchemaBase.extend({ step: z.literal("gst") }),
  invoiceStepSchema.extend({ step: z.literal("invoice") }),
  businessStepSchema.extend({ step: z.literal("business") }),
])

type OnboardingStepInput = z.infer<typeof onboardingStepSchema>

/**
 * Unified server action for saving any onboarding step
 * Uses discriminated union to validate based on step type
 */
export async function saveOnboardingStep(input: unknown): Promise<OnboardingResponse> {
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[saveOnboardingStep] Received input:", input)
    console.log("[saveOnboardingStep] Input keys:", Object.keys((input as object) || {}))
  }

  try {
    const { merchant } = await authorizeRequest()

    // Parse and validate input using discriminated union
    const parsed = onboardingStepSchema.safeParse(input)
    
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const err of parsed.error.errors) {
        const fieldPath = err.path.join(".")
        if (fieldPath) {
          fieldErrors[fieldPath] = err.message
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.error("[saveOnboardingStep] Validation failed:", {
          fieldErrors,
          errors: parsed.error.flatten(),
          input,
        })
      }

      return {
        success: false,
        error: "Please fix highlighted fields",
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      }
    }

    const { step, ...stepData } = parsed.data

    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[saveOnboardingStep] Validated step:", step)
      console.log("[saveOnboardingStep] Step data:", stepData)
    }

    // Server-side compliance validations
    const fieldErrors: Record<string, string> = {}
    let dobVerifiedAt: Date | null = null

    // PAN step: Validate 4th character matches PAN type and age 18+ (re-validate server-side)
    if (step === "pan" && "panNumber" in stepData && "panType" in stepData) {
      const panNumber = (stepData as any).panNumber as string
      const panType = (stepData as any).panType as PanType
      const panDobOrIncorp = (stepData as any).panDobOrIncorp as Date | undefined

      if (panNumber && panType) {
        // Validate 4th character
        const isValidPan = validatePan4thChar(panNumber, panType)
        if (!isValidPan) {
          const errorMessage = getPanTypeMismatchMessage(panNumber, panType)
          fieldErrors.panNumber = errorMessage

          // Log validation failure (best effort, don't block)
          logValidationFailure(
            merchant.id,
            "pan",
            "panNumber",
            "PAN_4TH_CHAR",
            false,
            errorMessage,
            panNumber.substring(0, 3) + "****" // Sanitized: only first 3 chars
          ).catch((err) => console.error("Failed to log validation:", err))
        } else {
          // Log validation success (best effort)
          logValidationFailure(
            merchant.id,
            "pan",
            "panNumber",
            "PAN_4TH_CHAR",
            true,
            null,
            panNumber.substring(0, 3) + "****"
          ).catch((err) => console.error("Failed to log validation:", err))
        }

        // Validate age 18+ for individuals
        if (panType === "INDIVIDUAL" && panDobOrIncorp) {
          const isValidAge = isAge18Plus(panDobOrIncorp)
          if (!isValidAge) {
            const errorMessage = getAgeValidationErrorMessage()
            fieldErrors.panDobOrIncorp = errorMessage

            // Log validation failure
            logValidationFailure(
              merchant.id,
              "pan",
              "panDobOrIncorp",
              "AGE_18_PLUS",
              false,
              errorMessage,
              null // Don't log DOB for privacy
            ).catch((err) => console.error("Failed to log validation:", err))
          } else {
            // Age is valid - set dobVerifiedAt when saving
            dobVerifiedAt = new Date()
          }
        }
      }
    }

    // GST step: Validate GST contains PAN (requires PAN from onboarding)
    if (step === "gst" && "gstin" in stepData && (stepData as any).gstin) {
      const gstin = (stepData as any).gstin as string

      // Get PAN from existing onboarding record
      const onboarding = await getOrCreateOnboarding(merchant.id)
      if (onboarding.panNumber) {
        const isValid = validateGstContainsPan(gstin, onboarding.panNumber)
        if (!isValid) {
          const errorMessage = getGstPanMismatchMessage()
          fieldErrors.gstin = errorMessage

          // Log validation failure (best effort, don't block)
          logValidationFailure(
            merchant.id,
            "gst",
            "gstin",
            "GST_PAN_MATCH",
            false,
            errorMessage,
            gstin.substring(0, 2) + "****" // Sanitized: only state code
          ).catch((err) => console.error("Failed to log validation:", err))
        } else {
          // Log validation success (best effort)
          logValidationFailure(
            merchant.id,
            "gst",
            "gstin",
            "GST_PAN_MATCH",
            true,
            null,
            gstin.substring(0, 2) + "****"
          ).catch((err) => console.error("Failed to log validation:", err))
        }
      }
    }

    // If server-side validations failed, return errors
    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Please fix highlighted fields",
        fieldErrors,
      }
    }

    // Check locks based on step
    // Note: panVerifiedAt and gstVerifiedAt fields don't exist in schema
    // Locking is handled at business logic level if needed
    const onboarding = await getOrCreateOnboarding(merchant.id)

    // Prepare step data with dobVerifiedAt if age validation passed
    const stepDataWithVerification = {
      ...stepData,
      ...(dobVerifiedAt && { dobVerifiedAt }),
    }

    // Update the step
    const result = await updateOnboardingStep(merchant.id, step, stepDataWithVerification as any)

    if (result.success) {
      // Revalidate paths to ensure fresh data
      revalidatePath("/dashboard/onboarding")
      revalidatePath("/dashboard")
      
      // DEV-only log for business step completion
      if (step === "business" && process.env.NODE_ENV === "development") {
        console.log("[saveOnboardingStep] Business step saved - onboarding marked as COMPLETED")
        console.log("[saveOnboardingStep] Updated onboarding status:", result.onboarding?.onboardingStatus)
      }
    }

    return result
  } catch (error) {
    console.error(`[saveOnboardingStep] Error saving ${(input as any)?.step || "unknown"} step:`, error)
    const safeError = toSafeApiError(error)
    return {
      success: false,
      error: safeError.message || "Failed to save onboarding data. Please try again.",
    }
  }
}

/**
 * Save PAN step data (legacy - use saveOnboardingStep instead)
 */
export async function savePanStep(data: unknown): Promise<OnboardingResponse> {
  return saveOnboardingStep({ ...(data as object), step: "pan" })
}

/**
 * Save GST step data (legacy - use saveOnboardingStep instead)
 */
export async function saveGstStep(data: unknown): Promise<OnboardingResponse> {
  const payload = data as any
  const step = payload?.step || "gst"

  // If step is "invoice", normalize and send as invoice step
  if (step === "invoice") {
    const normalized = normalizeInvoicePayload(payload)
    
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[saveGstStep] Invoice step - Raw payload:", payload)
      console.log("[saveGstStep] Invoice step - Normalized payload:", normalized)
    }
    
    return saveOnboardingStep({ ...normalized, step: "invoice" })
  }

  // Otherwise, send as GST step
  return saveOnboardingStep({ ...(data as object), step: "gst" })
}

/**
 * Save Business Basics step data (legacy - use saveOnboardingStep instead)
 */
export async function saveBusinessStep(data: unknown): Promise<OnboardingResponse> {
  return saveOnboardingStep({ ...(data as object), step: "business" })
}

/**
 * Complete onboarding
 */
export async function completeOnboardingStep(): Promise<OnboardingResponse> {
  try {
    const { merchant } = await authorizeRequest()
    const result = await completeOnboarding(merchant.id)

    if (result.success) {
      revalidatePath("/dashboard/onboarding")
      revalidatePath("/dashboard")
    }

    return result
  } catch (error) {
    console.error("[completeOnboardingStep] Error:", error)
    const safeError = toSafeApiError(error)
    return {
      success: false,
      error: safeError.message || "Failed to complete onboarding. Please try again.",
    }
  }
}

/**
 * Get onboarding data (for pages/components)
 */
export async function getOnboardingData() {
  try {
    const { merchant } = await authorizeRequest()
    const onboarding = await getOrCreateOnboarding(merchant.id)
    return { success: true, onboarding }
  } catch (error) {
    console.error("[getOnboardingData] Error:", error)
    return { success: false, onboarding: null }
  }
}

/**
 * Update PAN step (wrapper for OnboardingDetailsForm)
 */
export async function updateOnboardingPan(data: unknown): Promise<OnboardingResponse> {
  return saveOnboardingStep({ ...(data as object), step: "pan" })
}

/**
 * Update GST step (wrapper for OnboardingDetailsForm)
 */
export async function updateOnboardingGst(data: unknown): Promise<OnboardingResponse> {
  return saveOnboardingStep({ ...(data as object), step: "gst" })
}

/**
 * Update Business step (wrapper for OnboardingDetailsForm)
 */
export async function updateOnboardingBusiness(data: unknown): Promise<OnboardingResponse> {
  return saveOnboardingStep({ ...(data as object), step: "business" })
}

/**
 * Update Contact Info step (wrapper for OnboardingDetailsForm)
 * Maps contact* fields to invoice* fields in schema
 */
export async function updateOnboardingContactInfo(data: unknown): Promise<OnboardingResponse> {
  const payload = data as any
  // Map contact* fields to invoice* fields
  const mappedData = {
    invoiceAddressLine1: payload.contactAddressLine1 ?? payload.invoiceAddressLine1,
    invoiceAddressLine2: payload.contactAddressLine2 ?? payload.invoiceAddressLine2,
    invoiceCity: payload.contactCity ?? payload.invoiceCity,
    invoiceState: payload.contactState ?? payload.invoiceState,
    invoicePincode: payload.contactPincode ?? payload.invoicePincode,
    invoicePhone: payload.contactPhone ?? payload.invoicePhone,
    invoiceEmail: payload.contactEmail ?? payload.invoiceEmail,
  }
  return saveOnboardingStep({ ...mappedData, step: "invoice" })
}

/**
 * Log onboarding validation attempt (best effort, don't crash on failure)
 */
async function logValidationFailure(
  merchantId: string,
  step: string,
  field: string,
  validationType: string,
  passed: boolean,
  errorMessage: string | null,
  inputValue: string | null
): Promise<void> {
  try {
    // Type assertion needed until Prisma client is regenerated after migration
    await (prisma as any).onboardingValidationLog.create({
      data: {
        merchantId,
        step,
        field,
        validationType,
        passed,
        errorMessage,
        inputValue,
      },
    })
  } catch (error) {
    // Log but don't throw - validation logging should not block onboarding
    // This can fail if migration hasn't been run yet
    if (process.env.NODE_ENV === "development") {
      console.warn("[logValidationFailure] Failed to log validation (migration may not be run yet):", error)
    }
  }
}
