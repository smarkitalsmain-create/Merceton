"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  bankAccountDetailsSchema,
  bankAccountSubmitSchema,
  bankProofUpdateSchema,
  type BankAccountDetailsData,
  type BankAccountSubmitData,
  type BankProofUpdateData,
} from "@/lib/validations/bank"

/**
 * Upsert bank account details (draft/save without submission)
 * Does NOT set status to PENDING - just saves the details
 */
export async function upsertBankAccount(data: BankAccountDetailsData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = bankAccountDetailsSchema.parse(data)

    // Check if account exists
    const existing = await prisma.merchantBankAccount.findUnique({
      where: { merchantId: merchant.id },
    })

    // If status is VERIFIED (or verifiedAt is set), lock account details (require changeBankAccount flow)
    if (existing?.verificationStatus === "VERIFIED" || existing?.verifiedAt) {
      return {
        success: false,
        error: "Cannot edit verified account. Use 'Change Bank Account' to update.",
      }
    }

    const bankAccount = await prisma.merchantBankAccount.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        accountHolderName: validated.accountHolderName,
        bankName: validated.bankName,
        accountNumber: validated.accountNumber,
        ifscCode: validated.ifscCode.toUpperCase(),
        accountType: validated.accountType,
        verificationStatus: "NOT_SUBMITTED",
      },
      update: {
        // Only update if status allows (NOT_SUBMITTED or REJECTED)
        ...(existing?.verificationStatus === "REJECTED" ||
        existing?.verificationStatus === "NOT_SUBMITTED"
          ? {
              accountHolderName: validated.accountHolderName,
              bankName: validated.bankName,
              accountNumber: validated.accountNumber,
              ifscCode: validated.ifscCode.toUpperCase(),
              accountType: validated.accountType,
            }
          : {}),
      },
    })

    revalidatePath("/dashboard/settings/bank")
    return { success: true, bankAccount }
  } catch (error) {
    console.error("Upsert bank account error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to save bank account details" }
  }
}

/**
 * Submit bank account for verification
 * Requires proof document and sets status to PENDING
 */
export async function submitBankAccountForVerification(data: BankAccountSubmitData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = bankAccountSubmitSchema.parse(data)

    // Check if account exists
    const existing = await prisma.merchantBankAccount.findUnique({
      where: { merchantId: merchant.id },
    })

    if (!existing) {
      return {
        success: false,
        error: "Please save bank account details first",
      }
    }

    // If status is VERIFIED, require changeBankAccount flow
    if (existing.verificationStatus === "VERIFIED" || existing.verifiedAt) {
      return {
        success: false,
        error: "Cannot resubmit verified account. Use 'Change Bank Account' to update.",
      }
    }

    const bankAccount = await prisma.merchantBankAccount.update({
      where: { merchantId: merchant.id },
      data: {
        accountHolderName: validated.accountHolderName,
        bankName: validated.bankName,
        accountNumber: validated.accountNumber,
        ifscCode: validated.ifscCode.toUpperCase(),
        accountType: validated.accountType,
        proofType: validated.proofType,
        proofDocumentUrl: validated.proofDocumentUrl,
        proofUploadedAt: new Date(),
        verificationStatus: "PENDING",
        submittedAt: new Date(),
        // Clear rejection fields if resubmitting
        rejectedAt: null,
        rejectionReason: null,
      },
    })

    revalidatePath("/dashboard/settings/bank")
    return { success: true, bankAccount }
  } catch (error) {
    console.error("Submit bank account error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to submit bank account" }
  }
}

/**
 * Update proof document only (for PENDING status)
 */
export async function updateBankProof(data: BankProofUpdateData) {
  try {
    const { merchant } = await authorizeRequest()
    const validated = bankProofUpdateSchema.parse(data)

    const existing = await prisma.merchantBankAccount.findUnique({
      where: { merchantId: merchant.id },
    })

    if (!existing) {
      return {
        success: false,
        error: "Bank account not found",
      }
    }

    if (existing.verificationStatus !== "PENDING") {
      return {
        success: false,
        error: "Can only update proof when status is PENDING",
      }
    }

    const bankAccount = await prisma.merchantBankAccount.update({
      where: { merchantId: merchant.id },
      data: {
        proofType: validated.proofType,
        proofDocumentUrl: validated.proofDocumentUrl,
        proofUploadedAt: new Date(),
      },
    })

    revalidatePath("/dashboard/settings/bank")
    return { success: true, bankAccount }
  } catch (error) {
    console.error("Update bank proof error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    return { success: false, error: "Failed to update proof" }
  }
}

/**
 * Change bank account (resets verified account to NOT_SUBMITTED)
 * This unlocks editing for verified accounts
 */
export async function changeBankAccount() {
  try {
    const { merchant } = await authorizeRequest()

    const existing = await prisma.merchantBankAccount.findUnique({
      where: { merchantId: merchant.id },
    })

    if (!existing) {
      return {
        success: false,
        error: "Bank account not found",
      }
    }

    if (existing.verificationStatus !== "VERIFIED") {
      return {
        success: false,
        error: "Can only change verified bank accounts",
      }
    }

    const bankAccount = await prisma.merchantBankAccount.update({
      where: { merchantId: merchant.id },
      data: {
        verificationStatus: "NOT_SUBMITTED",
        // Clear verification timestamps
        verifiedAt: null,
        submittedAt: null,
        proofUploadedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        // Optionally clear proof (or keep it for reference)
        // proofType: null,
        // proofDocumentUrl: null,
      },
    })

    revalidatePath("/dashboard/settings/bank")
    return { success: true, bankAccount }
  } catch (error) {
    console.error("Change bank account error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to change bank account" }
  }
}
