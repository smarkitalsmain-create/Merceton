import { prisma } from "@/lib/prisma"

interface AllocateInvoiceNumberResult {
  invoiceNumber: string
  invoiceIssuedAt: Date
}

/**
 * Allocate invoice number for an order in a transaction-safe manner.
 * If order already has invoiceNumber, returns it.
 * Otherwise, allocates new number and increments store counter.
 */
export async function allocateInvoiceNumberForOrder(
  orderId: string,
  merchantId: string
): Promise<AllocateInvoiceNumberResult> {
  // First, check if order already has invoice number
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      invoiceNumber: true,
      invoiceIssuedAt: true,
    },
  })

  if (existingOrder?.invoiceNumber && existingOrder?.invoiceIssuedAt) {
    return {
      invoiceNumber: existingOrder.invoiceNumber,
      invoiceIssuedAt: existingOrder.invoiceIssuedAt,
    }
  }

  // Get merchant onboarding to determine invoice type
  const onboarding = await prisma.merchantOnboarding.findUnique({
    where: { merchantId },
    select: {
      gstStatus: true,
    },
  })

  const invoiceType = onboarding?.gstStatus === "REGISTERED" ? "TAX_INVOICE" : "BILL_OF_SUPPLY"

  // Allocate in transaction
  return await prisma.$transaction(async (tx) => {
    // Load store settings with invoice config
    const storeSettings = await tx.merchantStoreSettings.findUnique({
      where: { merchantId },
      select: {
        invoicePrefix: true,
        invoiceNextNumber: true,
        invoicePadding: true, // Note: schema field is invoicePadding, not invoiceNumberPadding
        invoiceSeriesFormat: true,
      },
    })

    // Defaults if store settings don't exist
    const prefix = storeSettings?.invoicePrefix || "MRC"
    let nextNumber = storeSettings?.invoiceNextNumber || 1
    const padding = storeSettings?.invoicePadding || 5 // Note: schema field is invoicePadding
    let seriesFormat = storeSettings?.invoiceSeriesFormat || "{PREFIX}-{YYYY}-{NNNNN}"

    // Validate series format: must include {NNNNN} token
    if (!seriesFormat.includes("{NNNNN}")) {
      console.warn(
        `Invalid invoice series format for merchant ${merchantId}: missing {NNNNN} token. Using default format.`
      )
      seriesFormat = "{PREFIX}-{YYYY}-{NNNNN}"
    }

    // Get current year
    const now = new Date()
    const year = now.getFullYear()

    // Check if we need to reset (compare with last invoice year)
    // Note: resetFy field doesn't exist in schema, so we always check year
    const lastInvoice = await tx.order.findFirst({
      where: {
        merchantId,
        invoiceNumber: { not: null },
      },
      orderBy: { invoiceIssuedAt: "desc" },
      select: { invoiceIssuedAt: true },
    })

    if (lastInvoice?.invoiceIssuedAt) {
      const lastYear = lastInvoice.invoiceIssuedAt.getFullYear()
      if (lastYear < year) {
        // New financial year, reset to 1
        nextNumber = 1
      }
    }

    // Build invoice number from format
    const paddedNumber = String(nextNumber).padStart(padding, "0")
    const invoiceNumber = seriesFormat
      .replace(/{PREFIX}/g, prefix)
      .replace(/{YYYY}/g, String(year))
      .replace(/{NNNNN}/g, paddedNumber)

    const invoiceIssuedAt = now

    // Update store settings: increment next number
    await tx.merchantStoreSettings.upsert({
      where: { merchantId },
      create: {
        merchantId,
        storeName: "Store", // Required field
        invoicePrefix: prefix,
        invoiceNextNumber: nextNumber + 1,
        invoicePadding: padding, // Note: schema field is invoicePadding
        invoiceSeriesFormat: seriesFormat,
      },
      update: {
        invoiceNextNumber: nextNumber + 1,
      },
    })

    // Update order with invoice number
    await tx.order.update({
      where: { id: orderId },
      data: {
        invoiceNumber,
        invoiceIssuedAt,
        invoiceType: invoiceType === "TAX_INVOICE" ? "TAX_INVOICE" : "BILL_OF_SUPPLY",
      },
    })

    return {
      invoiceNumber,
      invoiceIssuedAt,
    }
  })
}
