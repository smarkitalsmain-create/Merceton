/**
 * Step-based Validation Schemas
 * 
 * Each step has its own schema that validates ONLY fields for that step.
 * This prevents validation failures from unrelated fields.
 */

import { z } from "zod"
import {
  validatePan4thChar,
  getPanTypeMismatchMessage,
  validateGstContainsPan,
  getGstPanMismatchMessage,
  type PanType,
} from "./panRules"
import {
  isAge18Plus,
  getAgeValidationErrorMessage,
} from "./ageValidation"

/**
 * PAN Step Schema Base (for discriminated union)
 * 4th character validation is done server-side
 */
export const panStepSchemaBase = z.object({
  panType: z.enum(["INDIVIDUAL", "COMPANY", "HUF", "PARTNERSHIP", "LLP", "AOP", "BOI"], {
    required_error: "PAN type is required",
  }),
  panNumber: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => val.length === 10, "PAN must be 10 characters")
    .refine((val) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format"),
  panName: z.string().trim().min(1, "Name is required"),
  panDobOrIncorp: z.coerce.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date",
  }),
  panHolderRole: z.string().trim().min(1, "Role is required"),
})

/**
 * PAN Step Schema (with 4th character validation and age validation)
 * Used for client-side validation
 */
export const panStepSchema = panStepSchemaBase
  .refine(
    (data) => {
      // Validate 4th character matches PAN type
      return validatePan4thChar(data.panNumber, data.panType as PanType)
    },
    (data) => ({
      message: getPanTypeMismatchMessage(data.panNumber, data.panType as PanType),
      path: ["panNumber"],
    })
  )
  .refine(
    (data) => {
      // For individuals, validate age 18+
      if (data.panType === "INDIVIDUAL") {
        return isAge18Plus(data.panDobOrIncorp)
      }
      // For non-individuals, no age validation needed
      return true
    },
    (data) => ({
      message: getAgeValidationErrorMessage(),
      path: ["panDobOrIncorp"],
    })
  )

export type PanStepData = z.infer<typeof panStepSchema>

/**
 * GST Step Schema Base (for discriminated union)
 * Validates ONLY GST-related fields (NOT invoice fields)
 * Note: GST/PAN match validation is done in gstStepSchema (requires PAN from onboarding)
 */
export const gstStepSchemaBase = z.object({
  gstStatus: z.enum(["REGISTERED", "APPLIED", "NOT_REGISTERED"], {
    required_error: "GST status is required",
  }),
  gstin: z
    .preprocess(
      (v) => {
        if (typeof v !== "string") return v
        const t = v.trim().toUpperCase()
        return t === "" ? undefined : t
      },
      z
        .string()
        .refine(
          (val) => {
            if (!val) return true // Optional
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val)
          },
          "Invalid GSTIN format"
        )
        .optional()
    )
    .optional(),
  gstLegalName: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
  gstTradeName: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
  gstState: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
  gstComposition: z.coerce.boolean().default(false),
  gstNotRegisteredReason: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
})

/**
 * GST Step Schema (with refine for REGISTERED status)
 * Note: GST/PAN match validation requires PAN from onboarding record
 * This is handled server-side in saveGstStep action
 */
export const gstStepSchema = gstStepSchemaBase
  .refine(
    (data) => {
      // If REGISTERED, require GSTIN, Legal Name, and State
      if (data.gstStatus === "REGISTERED") {
        return !!(data.gstin && data.gstLegalName && data.gstState)
      }
      return true
    },
    {
      message: "GSTIN, Legal Name, and State are required when GST status is REGISTERED",
      path: ["gstin"],
    }
  )
  // Note: GST/PAN match validation is done server-side in saveGstStep
  // because it requires PAN from the onboarding record

export type GstStepData = z.infer<typeof gstStepSchema>

/**
 * Combined GST + Invoice Step Data (for frontend form)
 * Frontend form includes both GST and invoice fields
 * Backend validates separately based on step parameter
 */
export type GstWithInvoiceStepData = GstStepData & InvoiceStepData

/**
 * Invoice Step Schema
 * Validates ONLY invoice/billing address fields
 * Uses .trim() before validation to ensure whitespace is handled correctly
 */
export const invoiceStepSchema = z.object({
  invoiceAddressLine1: z
    .string()
    .trim()
    .min(1, "Address line 1 is required"),
  invoiceAddressLine2: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  invoiceCity: z
    .string()
    .trim()
    .min(1, "City is required"),
  invoicePincode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, "")) // Remove non-digits
    .refine((val) => val.length === 6, "Pincode must be exactly 6 digits"),
  invoiceState: z
    .string()
    .trim()
    .min(1, "State is required"),
  invoicePhone: z
    .string()
    .trim()
    .transform((val) => {
      if (!val || val === "") return undefined
      const digits = val.replace(/\D/g, "")
      return digits === "" ? undefined : digits
    })
    .refine(
      (val) => !val || (val.length >= 10 && val.length <= 13),
      "Phone must be 10 to 13 digits"
    )
    .optional(),
  invoiceEmail: z
    .string()
    .trim()
    .transform((val) => {
      if (!val || val === "") return undefined
      return val.toLowerCase()
    })
    .refine(
      (val) => {
        if (!val) return true // Optional
        // Basic email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      },
      "Invalid email format"
    )
    .optional(),
  invoicePrefix: z
    .string()
    .trim()
    .transform((val) => {
      if (!val || val === "") return undefined
      const sanitized = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
      return sanitized === "" ? undefined : sanitized
    })
    .refine((val) => !val || /^[A-Z0-9]{1,8}$/.test(val), "Only A-Z and 0-9 allowed, max 8 characters")
    .optional(),
})

export type InvoiceStepData = z.infer<typeof invoiceStepSchema>

/**
 * Business Basics Step Schema
 * Validates only business-related fields
 */
export const businessStepSchema = z.object({
  storeDisplayName: z.string().trim().min(1, "Store display name is required"),
  legalBusinessName: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
  yearStarted: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  businessType: z
    .enum([
      "SOLE_PROPRIETORSHIP",
      "PARTNERSHIP",
      "LLP",
      "PVT_LTD",
      "PUBLIC_LTD",
      "HUF",
      "OTHER",
    ])
    .optional(),
  primaryCategory: z.string().trim().min(1, "Primary category is required"),
  secondaryCategory: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().optional()
    )
    .optional(),
  avgPriceRange: z
    .enum(["UNDER_500", "500_1000", "1000_5000", "5000_10000", "ABOVE_10000"])
    .optional(),
  expectedSkuRange: z
    .enum(["UNDER_10", "10_50", "50_100", "100_500", "ABOVE_500"])
    .optional(),
})

export type BusinessStepData = z.infer<typeof businessStepSchema>

/**
 * Normalize invoice payload keys
 * Maps various frontend key names to backend expected keys
 */
export function normalizeInvoicePayload(body: any): any {
  return {
    invoiceAddressLine1: body.invoiceAddressLine1 ?? body.addressLine1 ?? body.address ?? "",
    invoiceAddressLine2: body.invoiceAddressLine2 ?? body.addressLine2 ?? undefined,
    invoiceCity: body.invoiceCity ?? body.city ?? "",
    invoicePincode: body.invoicePincode ?? body.pincode ?? body.postalCode ?? "",
    invoicePhone: body.invoicePhone ?? body.phone ?? body.phoneNumber ?? undefined,
    invoiceEmail: body.invoiceEmail ?? body.email ?? undefined,
    invoicePrefix: body.invoicePrefix ?? body.invoiceNumberPrefix ?? body.prefix ?? undefined,
    invoiceState: body.invoiceState ?? body.state ?? body.gstState ?? "",
  }
}
