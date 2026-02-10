import { z } from "zod"

/**
 * Validation schema for creating/updating pricing packages
 * Note: status is not included - always DRAFT on create, cannot change via update
 */
export const pricingPackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  fixedFeePaise: z
    .number()
    .int()
    .min(0, "Fixed fee must be >= 0")
    .max(1000000, "Fixed fee must be <= ₹10,000"),
  variableFeeBps: z
    .number()
    .int()
    .min(0, "Variable fee must be >= 0")
    .max(1000, "Variable fee must be <= 10%"),
  domainPricePaise: z
    .number()
    .int()
    .min(0, "Domain price must be >= 0")
    .max(500000, "Domain price must be <= ₹5,000"),
  domainAllowed: z.boolean(),
  domainIncluded: z.boolean(),
  payoutFrequency: z.enum(["WEEKLY", "DAILY", "MANUAL"]),
  holdbackBps: z
    .number()
    .int()
    .min(0, "Holdback must be >= 0")
    .max(5000, "Holdback must be <= 50%"),
  isPayoutHold: z.boolean(),
  isActive: z.boolean(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
})

/**
 * Validation schema for merchant fee config overrides (admin only)
 */
export const merchantFeeOverrideSchema = z.object({
  fixedFeeOverridePaise: z.number().int().min(0).max(1000000).optional().nullable(),
  variableFeeOverrideBps: z.number().int().min(0).max(1000).optional().nullable(),
  payoutFrequencyOverride: z.enum(["WEEKLY", "DAILY", "MANUAL"]).optional().nullable(),
  holdbackOverrideBps: z.number().int().min(0).max(5000).optional().nullable(),
  isPayoutHoldOverride: z.boolean().optional().nullable(),
})

/**
 * Validation schema for assigning package to merchant
 */
export const assignPackageSchema = z.object({
  pricingPackageId: z.string().min(1, "Package ID is required"),
  reason: z.string().min(1, "Reason is required").max(500),
})

// Merchant package selection removed - merchants cannot change plans

/**
 * Validation schema for audit log reason
 */
export const auditReasonSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
})
