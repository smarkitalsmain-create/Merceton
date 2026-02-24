import { prisma } from "@/lib/prisma"

interface AllocatePlatformInvoiceNumberResult {
  invoiceNumber: string
}

/**
 * Allocate invoice number for platform invoices in a transaction-safe manner.
 * Uses PlatformBillingProfile settings.
 */
export async function allocatePlatformInvoiceNumber(): Promise<AllocatePlatformInvoiceNumberResult> {
  return await prisma.$transaction(async (tx) => {
    // Load platform billing profile (singleton)
    const profile = await tx.platformBillingProfile.findUnique({
      where: { id: "platform" },
      select: {
        invoicePrefix: true,
        invoiceNextNumber: true,
        invoicePadding: true,
        seriesFormat: true,
      },
    })

    // Defaults if profile doesn't exist
    const prefix = profile?.invoicePrefix || "SMK"
    let nextNumber = profile?.invoiceNextNumber || 1
    const padding = profile?.invoicePadding || 5
    let seriesFormat = profile?.seriesFormat || "{PREFIX}-{FY}-{NNNNN}"

    // Validate series format: must include {NNNNN} token
    if (!seriesFormat.includes("{NNNNN}")) {
      console.warn(
        `Invalid platform invoice series format: missing {NNNNN} token. Using default format.`
      )
      seriesFormat = "{PREFIX}-{FY}-{NNNNN}"
    }

    // Get current financial year (April to March in India)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    const financialYear = currentMonth >= 4 ? currentYear : currentYear - 1
    const fy = `${financialYear}-${String(financialYear + 1).slice(-2)}` // e.g., "2024-25"

    // Build invoice number from format
    const paddedNumber = String(nextNumber).padStart(padding, "0")
    const invoiceNumber = seriesFormat
      .replace(/{PREFIX}/g, prefix)
      .replace(/{FY}/g, fy)
      .replace(/{YYYY}/g, String(currentYear))
      .replace(/{NNNNN}/g, paddedNumber)

    // Update profile: increment next number
    await tx.platformBillingProfile.upsert({
      where: { id: "platform" },
      create: {
        id: "platform",
        legalName: "Merceton", // Required field
        invoicePrefix: prefix,
        invoiceNextNumber: nextNumber + 1,
        invoicePadding: padding,
        seriesFormat: seriesFormat,
      },
      update: {
        invoiceNextNumber: nextNumber + 1,
      },
    })

    return {
      invoiceNumber,
    }
  })
}
