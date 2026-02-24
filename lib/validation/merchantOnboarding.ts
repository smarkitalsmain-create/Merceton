/**
 * Validation and sanitization for merchant onboarding data
 * Prevents Prisma errors by ensuring only valid, sanitized data reaches the database
 * 
 * Type safety: All sanitizer functions return Prisma.MerchantOnboardingUpdateInput
 * which ensures only valid Prisma fields can be passed to update().
 */

import { z } from "zod"
import type { Prisma } from "@prisma/client"

// Type guard to ensure only sanitized data reaches Prisma
type SanitizedOnboardingData = Prisma.MerchantOnboardingUpdateInput

/**
 * Sanitize string: trim and convert empty string to null
 */
function sanitizeString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === "" ? null : trimmed
}

/**
 * Sanitize phone: digits only, 10-13 length, or null
 */
function sanitizePhone(value: string | null | undefined): string | null {
  const sanitized = sanitizeString(value)
  if (!sanitized) return null
  const digits = sanitized.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 13) return null
  return digits
}

/**
 * Sanitize pincode: exactly 6 digits, or null
 */
function sanitizePincode(value: string | null | undefined): string | null {
  const sanitized = sanitizeString(value)
  if (!sanitized) return null
  const digits = sanitized.replace(/\D/g, "")
  return digits.length === 6 ? digits : null
}

/**
 * Sanitize GSTIN: uppercase, validate format, or null
 */
function sanitizeGstin(value: string | null | undefined): string | null {
  const sanitized = sanitizeString(value)
  if (!sanitized) return null
  const upper = sanitized.toUpperCase().trim()
  // GSTIN format: 15 alphanumeric (2 state + 10 PAN + 3 check)
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(upper)) {
    return null
  }
  return upper
}

/**
 * PAN Step sanitizer
 */
export const panStepSanitizer = z.object({
  panType: z.enum(["INDIVIDUAL", "COMPANY", "HUF", "PARTNERSHIP", "LLP", "AOP", "BOI"]),
  panNumber: z
    .string()
    .transform((val) => {
      const sanitized = sanitizeString(val)
      return sanitized ? sanitized.toUpperCase().trim() : null
    })
    .refine((val) => val !== null, "PAN number is required")
    .refine((val) => val === null || val.length === 10, "PAN must be 10 characters")
    .refine((val) => val === null || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format"),
  panName: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "Name is required"),
  panDobOrIncorp: z.coerce.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date",
  }),
  panHolderRole: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "Role is required"),
})

/**
 * GST Step sanitizer (includes invoice/billing address)
 */
export const gstStepSanitizer = z
  .object({
    gstStatus: z.enum(["REGISTERED", "APPLIED", "NOT_REGISTERED"]),
    gstin: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeGstin(val) : null)),
    gstLegalName: z
      .string()
      .optional()
      .transform((val) => sanitizeString(val)),
    gstTradeName: z
      .string()
      .optional()
      .transform((val) => sanitizeString(val)),
    gstState: z
      .string()
      .optional()
      .transform((val) => sanitizeString(val)),
    gstComposition: z.boolean().default(false),
    gstNotRegisteredReason: z
      .string()
      .optional()
      .transform((val) => sanitizeString(val)),
    // Invoice/Billing Address fields
    invoiceAddressLine1: z
      .string()
      .trim()
      .min(1, "Address line 1 is required"),
    invoiceAddressLine2: z
      .preprocess(
        (v) => {
          if (typeof v !== "string") return v
          const t = v.trim()
          return t === "" ? undefined : t
        },
        z.string().optional()
      ),
    invoiceCity: z
      .string()
      .trim()
      .min(1, "City is required"),
    invoicePincode: z
      .coerce.string()
      .trim()
      .transform((val) => {
        // Extract digits only
        const digits = val.replace(/\D/g, "")
        return digits
      })
      .refine((val) => val.length === 6, "Pincode must be exactly 6 digits"),
    invoicePhone: z.preprocess(
      (v) => {
        if (typeof v !== "string") return v
        const t = v.trim()
        if (t === "") return undefined
        // Remove all non-digits
        const digits = t.replace(/\D/g, "")
        // Return undefined if empty after digit extraction, otherwise return digits
        return digits === "" ? undefined : digits
      },
      z
        .string()
        .refine(
          (val) => {
            // If undefined, it's optional so valid
            if (!val) return true
            // Must be 10-13 digits
            return val.length >= 10 && val.length <= 13
          },
          {
            message: "Phone must be 10 to 13 digits",
          }
        )
        .optional()
    ),
    invoiceEmail: z.preprocess(
      (v) => {
        if (typeof v === "string" && v.trim() === "") return null
        if (typeof v === "string") return v.trim().toLowerCase()
        return v
      },
      z.string().email("Invalid email format").nullable().optional()
    ),
    invoicePrefix: z.preprocess(
      (v) => {
        if (typeof v !== "string") return v
        const t = v.trim()
        // Treat empty string as undefined (UI handles default "MRC")
        if (t === "") return undefined
        const sanitized = t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
        return sanitized || undefined
      },
      z
        .string()
        .trim()
        .max(8, "Prefix must be 8 characters or less")
        .regex(/^[A-Z0-9]*$/, "Only A-Z and 0-9 allowed") // Use * to allow empty string
        .optional()
    ),
  })
  .refine(
    (data) => {
      if (data.gstStatus === "REGISTERED") {
        return data.gstin !== null && data.gstLegalName !== null && data.gstState !== null
      }
      return true
    },
    {
      message: "GSTIN, Legal Name, and State are required when GST status is REGISTERED",
      path: ["gstin"],
    }
  )

/**
 * Business Basics Step sanitizer
 */
export const businessBasicsStepSanitizer = z.object({
  storeDisplayName: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "Store display name is required"),
  legalBusinessName: z
    .string()
    .optional()
    .transform((val) => sanitizeString(val)),
  yearStarted: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  businessType: z
    .enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "LLP", "PVT_LTD", "PUBLIC_LTD", "HUF", "OTHER"])
    .optional()
    .nullable(),
  primaryCategory: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "Primary category is required"),
  secondaryCategory: z
    .string()
    .optional()
    .transform((val) => sanitizeString(val)),
  avgPriceRange: z
    .enum(["UNDER_500", "500_1000", "1000_5000", "5000_10000", "ABOVE_10000"])
    .optional()
    .nullable(),
  expectedSkuRange: z
    .enum(["UNDER_10", "10_50", "50_100", "100_500", "ABOVE_500"])
    .optional()
    .nullable(),
})

/**
 * Contact Info sanitizer
 */
export const contactInfoSanitizer = z.object({
  contactEmail: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : sanitizeString(val))),
  contactPhone: z
    .string()
    .optional()
    .transform((val) => sanitizePhone(val)),
  websiteUrl: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : sanitizeString(val))),
  contactAddressLine1: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "Address line 1 is required"),
  contactAddressLine2: z
    .string()
    .optional()
    .transform((val) => sanitizeString(val)),
  contactCity: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "City is required"),
  contactState: z
    .string()
    .transform((val) => sanitizeString(val))
    .refine((val) => val !== null, "State is required"),
  contactPincode: z
    .coerce.string()
    .trim()
    .transform((val) => {
      // Extract digits only
      const digits = val.replace(/\D/g, "")
      return digits
    })
    .refine((val) => val.length === 6, "Pincode must be exactly 6 digits"),
})

/**
 * Sanitize PAN step data and return Prisma-compatible update input
 */
export function sanitizePanStep(
  input: unknown
): { ok: true; data: Prisma.MerchantOnboardingUpdateInput } | { ok: false; error: z.ZodError } {
  try {
    const validated = panStepSanitizer.parse(input)
    return {
      ok: true,
      data: {
        panType: validated.panType,
        panNumber: validated.panNumber,
        panName: validated.panName,
        panDobOrIncorp: validated.panDobOrIncorp,
        panHolderRole: validated.panHolderRole,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error }
    }
    throw error
  }
}

/**
 * Sanitize GST step data and return Prisma-compatible update input
 */
export function sanitizeGstStep(
  input: unknown
): { ok: true; data: Prisma.MerchantOnboardingUpdateInput } | { ok: false; error: z.ZodError } {
  try {
    const validated = gstStepSanitizer.parse(input)
    const data: Prisma.MerchantOnboardingUpdateInput = {
      gstStatus: validated.gstStatus,
      gstComposition: validated.gstComposition,
      invoiceAddressLine1: validated.invoiceAddressLine1,
      invoiceAddressLine2: validated.invoiceAddressLine2,
      invoiceCity: validated.invoiceCity,
      invoicePincode: validated.invoicePincode,
      invoicePhone: validated.invoicePhone,
      invoiceEmail: validated.invoiceEmail,
      // Use "MRC" as default if undefined (UI handles default, but ensure DB has value)
      invoicePrefix: validated.invoicePrefix || "MRC",
    }

    if (validated.gstStatus === "REGISTERED") {
      data.gstin = validated.gstin
      data.gstLegalName = validated.gstLegalName
      data.gstTradeName = validated.gstTradeName
      data.gstState = validated.gstState
    } else if (validated.gstStatus === "NOT_REGISTERED") {
      data.gstNotRegisteredReason = validated.gstNotRegisteredReason
    }

    return { ok: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error }
    }
    throw error
  }
}

/**
 * Sanitize Business Basics step data and return Prisma-compatible update input
 */
export function sanitizeBusinessBasicsStep(
  input: unknown
): { ok: true; data: Prisma.MerchantOnboardingUpdateInput } | { ok: false; error: z.ZodError } {
  try {
    const validated = businessBasicsStepSanitizer.parse(input)
    return {
      ok: true,
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
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error }
    }
    throw error
  }
}

/**
 * Sanitize Contact Info data and return Prisma-compatible update input
 */
export function sanitizeContactInfo(
  input: unknown
): { ok: true; data: Prisma.MerchantOnboardingUpdateInput } | { ok: false; error: z.ZodError } {
  try {
    const validated = contactInfoSanitizer.parse(input)
    return {
      ok: true,
      data: {
        // Map contact* fields to invoice* fields in schema
        invoiceEmail: validated.contactEmail,
        invoicePhone: validated.contactPhone,
        // websiteUrl doesn't exist in schema - omit it
        invoiceAddressLine1: validated.contactAddressLine1,
        invoiceAddressLine2: validated.contactAddressLine2,
        invoiceCity: validated.contactCity,
        invoiceState: validated.contactState,
        invoicePincode: validated.contactPincode,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error }
    }
    throw error
  }
}
