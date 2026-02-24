/**
 * Invoice/Billing Address step validation schema
 * This schema validates ONLY invoice fields, not GST fields
 */

import { z } from "zod"

/**
 * Normalize invoice payload keys
 * Maps various frontend key names to backend expected keys
 */
export function normalizeInvoicePayload(body: any): any {
  // Normalize all possible key variations to backend expected keys
  const normalized: any = {
    invoiceAddressLine1: body.invoiceAddressLine1 ?? body.addressLine1 ?? body.address ?? "",
    invoiceAddressLine2: body.invoiceAddressLine2 ?? body.addressLine2 ?? undefined,
    invoiceCity: body.invoiceCity ?? body.city ?? "",
    invoicePincode: body.invoicePincode ?? body.pincode ?? body.postalCode ?? "",
    invoicePhone: body.invoicePhone ?? body.phone ?? body.phoneNumber ?? undefined,
    invoiceEmail: body.invoiceEmail ?? body.email ?? undefined,
    invoicePrefix: body.invoicePrefix ?? body.invoiceNumberPrefix ?? body.prefix ?? undefined,
    // State might come from GST step, so check multiple sources
    invoiceState: body.invoiceState ?? body.state ?? body.gstState ?? undefined,
    // Composition scheme (if present)
    compositionScheme: body.compositionScheme ?? body.underCompositionScheme ?? body.gstComposition ?? false,
  }
  
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[normalizeInvoicePayload] Input keys:", Object.keys(body || {}))
    console.log("[normalizeInvoicePayload] Normalized keys:", Object.keys(normalized))
    console.log("[normalizeInvoicePayload] Normalized values:", normalized)
  }
  
  return normalized
}

/**
 * Invoice step schema - validates ONLY invoice/billing address fields
 * Does NOT require GST fields
 */
export const invoiceStepSchema = z.object({
  // Required invoice fields
  invoiceAddressLine1: z
    .string()
    .trim()
    .min(1, "Address line 1 is required"),
  
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
  
  // Optional invoice fields
  invoiceAddressLine2: z
    .preprocess(
      (v) => {
        if (typeof v !== "string") return v
        const t = v.trim()
        return t === "" ? undefined : t
      },
      z.string().optional()
    ),
  
  invoicePhone: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v
      const t = v.trim()
      if (t === "") return undefined
      // Remove all non-digits
      const digits = t.replace(/\D/g, "")
      return digits === "" ? undefined : digits
    },
    z
      .string()
      .refine(
        (val) => {
          if (!val) return true // Optional
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
      if (typeof v === "string" && v.trim() === "") return undefined
      if (typeof v === "string") return v.trim().toLowerCase()
      return v
    },
    z.string().email("Invalid email format").optional()
  ),
  
  invoicePrefix: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v
      const t = v.trim()
      if (t === "") return undefined
      const sanitized = t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
      return sanitized || undefined
    },
    z
      .string()
      .trim()
      .max(8, "Prefix must be 8 characters or less")
      .regex(/^[A-Z0-9]*$/, "Only A-Z and 0-9 allowed")
      .optional()
  ),
  
  // State is required for invoice step
  invoiceState: z
    .string()
    .trim()
    .min(1, "State is required"),
})

export type InvoiceStepData = z.infer<typeof invoiceStepSchema>
