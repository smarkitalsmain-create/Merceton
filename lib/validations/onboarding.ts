import { z } from "zod"

// PAN Step
export const panStepSchema = z.object({
  panType: z.enum(["INDIVIDUAL", "COMPANY", "HUF", "PARTNERSHIP", "LLP", "AOP", "BOI"]),
  panNumber: z
    .string()
    .length(10, "PAN must be 10 characters")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format"),
  panName: z.string().min(1, "Name is required"),
  // Coerce incoming value (string \"YYYY-MM-DD\" from <input type=\"date\"> OR Date) into a Date object
  panDobOrIncorp: z.coerce.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date",
  }),
  panHolderRole: z.string().min(1, "Role is required"),
})

export type PanStepData = z.infer<typeof panStepSchema>

// GST Step
export const gstStepSchema = z.object({
  gstStatus: z.enum(["REGISTERED", "APPLIED", "NOT_REGISTERED"]),
  gstin: z.string().optional(),
  gstLegalName: z.string().optional(),
  gstTradeName: z.string().optional(),
  gstState: z.string().optional(),
  gstComposition: z.boolean().default(false),
  gstNotRegisteredReason: z.string().optional(),
}).refine(
  (data) => {
    if (data.gstStatus === "REGISTERED") {
      return !!data.gstin && !!data.gstLegalName && !!data.gstState
    }
    return true
  },
  {
    message: "GSTIN, Legal Name, and State are required when GST status is REGISTERED",
    path: ["gstin"],
  }
).refine(
  (data) => {
    if (data.gstStatus === "REGISTERED" && data.gstin) {
      // Validate GSTIN format: 15 alphanumeric
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(data.gstin)
    }
    return true
  },
  {
    message: "Invalid GSTIN format",
    path: ["gstin"],
  }
)

export type GstStepData = z.infer<typeof gstStepSchema>

// Business Basics Step
export const businessBasicsStepSchema = z.object({
  storeDisplayName: z.string().min(1, "Store display name is required"),
  legalBusinessName: z.string().optional(),
  yearStarted: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  businessType: z.enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "LLP", "PVT_LTD", "PUBLIC_LTD", "HUF", "OTHER"]).optional(),
  primaryCategory: z.string().min(1, "Primary category is required"),
  secondaryCategory: z.string().optional(),
  avgPriceRange: z.enum(["UNDER_500", "500_1000", "1000_5000", "5000_10000", "ABOVE_10000"]).optional(),
  expectedSkuRange: z.enum(["UNDER_10", "10_50", "50_100", "100_500", "ABOVE_500"]).optional(),
})

export type BusinessBasicsStepData = z.infer<typeof businessBasicsStepSchema>
