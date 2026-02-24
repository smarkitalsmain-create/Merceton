/**
 * Dedicated validation schema for invoice/billing address step
 * Matches UI field names exactly and handles all edge cases
 */

import { z } from "zod"

/**
 * Invoice/Billing Address Schema
 * 
 * Field names must match exactly what the UI sends:
 * - invoiceAddressLine1, invoiceAddressLine2
 * - invoiceCity
 * - invoicePincode (accepts string or number)
 * - invoicePhone (optional, digits only)
 * - invoiceEmail (optional, email format)
 * - invoicePrefix (optional, alphanumeric, max 8)
 * - gstState (for GST registered status)
 */
export const invoiceAddressSchema = z.object({
  // Required fields
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
      return val.replace(/\D/g, "")
    })
    .refine((val) => val.length === 6, "Pincode must be exactly 6 digits"),
  
  // Optional fields with proper handling
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
      return t === "" ? undefined : t
    },
    z
      .string()
      .trim()
      .transform((val) => {
        // Remove all non-digits
        return val.replace(/\D/g, "")
      })
      .refine(
        (val) => val.length === 0 || (val.length >= 10 && val.length <= 13),
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
      .max(8, "Prefix must be 8 characters or less")
      .regex(/^[A-Z0-9]+$/, "Only A-Z and 0-9 allowed")
      .optional()
  ),
  
  // GST-related fields (may be required if GST status is REGISTERED)
  gstState: z
    .preprocess(
      (v) => {
        if (typeof v !== "string") return v
        return v.trim() === "" ? undefined : v.trim()
      },
      z.string().optional()
    ),
})

export type InvoiceAddressData = z.infer<typeof invoiceAddressSchema>
