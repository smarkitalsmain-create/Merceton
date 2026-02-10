import { z } from "zod"

// IFSC regex: ^[A-Z]{4}0[A-Z0-9]{6}$
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/

// Account number: 6-20 characters (string)
const accountNumberSchema = z
  .string()
  .min(6, "Account number must be at least 6 characters")
  .max(20, "Account number must be at most 20 characters")
  .regex(/^[0-9]+$/, "Account number must contain only digits")

// Bank account details schema (for draft/save)
export const bankAccountDetailsSchema = z.object({
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: accountNumberSchema,
  ifscCode: z
    .string()
    .regex(ifscRegex, "Invalid IFSC code format (e.g., ABCD0123456)"),
  accountType: z.enum(["SAVINGS", "CURRENT"]),
})

export type BankAccountDetailsData = z.infer<typeof bankAccountDetailsSchema>

// Proof upload schema (for submission)
export const bankProofSchema = z.object({
  proofType: z.enum(["CANCELLED_CHEQUE", "BANK_STATEMENT"]),
  proofDocumentUrl: z.string().url("Valid proof document URL is required"),
})

export type BankProofData = z.infer<typeof bankProofSchema>

// Combined schema for submission (requires both details and proof)
export const bankAccountSubmitSchema = bankAccountDetailsSchema.merge(bankProofSchema)

export type BankAccountSubmitData = z.infer<typeof bankAccountSubmitSchema>

// Update proof only (for PENDING status)
export const bankProofUpdateSchema = bankProofSchema

export type BankProofUpdateData = z.infer<typeof bankProofUpdateSchema>
