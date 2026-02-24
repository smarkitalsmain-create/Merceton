import { prisma } from "@/lib/prisma"
import { getFinancialYear } from "./financialYear"

/**
 * Allocate next invoice number for a financial year atomically
 * Format: MERC/FY25-26/000123
 * 
 * NOTE: invoiceSequence model removed - using PlatformBillingProfile instead
 */
export async function allocateInvoiceNumber(
  financialYear: string
): Promise<string> {
  // Use PlatformBillingProfile for invoice numbering
  return await prisma.$transaction(async (tx) => {
    const profile = await tx.platformBillingProfile.findUnique({
      where: { id: "platform" },
      select: {
        invoicePrefix: true,
        invoiceNextNumber: true,
        invoicePadding: true,
        seriesFormat: true,
      },
    })

    const prefix = profile?.invoicePrefix || "MERC"
    let nextNumber = profile?.invoiceNextNumber || 1
    const padding = profile?.invoicePadding || 6
    let seriesFormat = profile?.seriesFormat || "{PREFIX}/FY{FY}/{NNNNN}"

    // Validate series format
    if (!seriesFormat.includes("{NNNNN}")) {
      seriesFormat = "{PREFIX}/FY{FY}/{NNNNN}"
    }

    // Build invoice number
    const padded = String(nextNumber).padStart(padding, "0")
    const invoiceNumber = seriesFormat
      .replace(/{PREFIX}/g, prefix)
      .replace(/{FY}/g, financialYear)
      .replace(/{NNNNN}/g, padded)

    // Increment next number
    await tx.platformBillingProfile.upsert({
      where: { id: "platform" },
      create: {
        id: "platform",
        legalName: "Merceton",
        invoicePrefix: prefix,
        invoiceNextNumber: nextNumber + 1,
        invoicePadding: padding,
        seriesFormat: seriesFormat,
      },
      update: {
        invoiceNextNumber: nextNumber + 1,
      },
    })

    return invoiceNumber
  })
}

/**
 * Get invoice number for a date (uses current FY)
 */
export async function allocateInvoiceNumberForDate(
  date: Date = new Date()
): Promise<string> {
  const fy = getFinancialYear(date)
  return allocateInvoiceNumber(fy)
}
