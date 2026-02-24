import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { InvoiceLineItem, InvoiceTotals } from "./types"
import { LedgerEntry } from "@prisma/client"

/**
 * Tax type (local type, not from Prisma enum)
 */
type TaxType = "CGST_SGST" | "IGST"

/**
 * Determine tax type based on supplier and recipient state codes
 */
function determineTaxType(
  supplierStateCode: string,
  recipientStateCode: string | null
): TaxType {
  if (!recipientStateCode) {
    // If merchant state unknown, default to IGST
    return "IGST"
  }
  // Same state => CGST+SGST, different => IGST
  return supplierStateCode === recipientStateCode ? "CGST_SGST" : "IGST"
}

/**
 * Calculate GST split for a taxable amount
 * Assumes 18% GST rate (can be made configurable)
 */
function calculateGst(
  taxableValue: number,
  taxType: TaxType,
  gstRate: number = 18
): { cgst: number; sgst: number; igst: number } {
  const gstAmount = (taxableValue * gstRate) / 100

  if (taxType === "CGST_SGST") {
    // Split 18% into 9% CGST + 9% SGST
    const half = gstAmount / 2
    return {
      cgst: Math.round(half * 100) / 100, // Round to 2 decimals
      sgst: Math.round(half * 100) / 100,
      igst: 0,
    }
  } else {
    // IGST: 18% as single tax
    return {
      cgst: 0,
      sgst: 0,
      igst: Math.round(gstAmount * 100) / 100,
    }
  }
}

/**
 * Get state code from state name or code
 * Returns 2-digit state code if possible
 */
function getStateCode(state: string | null | undefined): string | null {
  if (!state) return null
  // If already 2 digits, return as-is
  if (/^\d{2}$/.test(state)) return state
  // TODO: Add state name to code mapping if needed
  // For now, extract first 2 digits if present, or return null
  const match = state.match(/\d{2}/)
  return match ? match[0] : null
}

/**
 * Aggregate ledger entries into invoice line items
 * Groups by orderId (or by day if orderId is null)
 */
export async function aggregateLedgerEntriesForInvoice(
  merchantId: string,
  from: Date,
  to: Date,
  supplierStateCode: string,
  recipientStateCode: string | null,
  gstRate: number = 18
): Promise<{
  lineItems: InvoiceLineItem[]
  totals: InvoiceTotals
  taxType: TaxType
}> {
  // Fetch PLATFORM_FEE entries in date range
  // Exclude entries that are reversed (status = FAILED or have reversal metadata)
  // Note: occurredAt field doesn't exist in schema - using createdAt instead
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      merchantId,
      type: "PLATFORM_FEE",
      createdAt: {
        gte: from,
        lte: to,
      },
      status: {
        not: "FAILED", // Exclude failed entries
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  if (entries.length === 0) {
    return {
      lineItems: [],
      totals: {
        totalTaxable: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        grandTotal: 0,
      },
      taxType: determineTaxType(supplierStateCode, recipientStateCode),
    }
  }

  // Determine tax type once for all entries
  const taxType = determineTaxType(supplierStateCode, recipientStateCode)

  // Group by orderId (or by day if orderId is null)
  const grouped = new Map<string, LedgerEntry[]>()
  for (const entry of entries) {
    // Note: occurredAt doesn't exist - using createdAt instead
    const key = entry.orderId || entry.createdAt.toISOString().slice(0, 10) // Use date as key if no orderId
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(entry)
  }

  // Build line items
  const lineItems: InvoiceLineItem[] = []
  for (const [key, groupEntries] of Array.from(grouped.entries())) {
    // Sum amounts for this group
    let totalAmount = 0
    for (const entry of groupEntries) {
      totalAmount += entry.amount.toNumber()
    }

    // Use first entry for metadata
    const firstEntry = groupEntries[0]
    const orderId = firstEntry.orderId
    const orderNumber = null // orderNumber not available in LedgerEntry relation

    // Calculate GST
    const taxableValue = totalAmount
    const { cgst, sgst, igst } = calculateGst(taxableValue, taxType, gstRate)
    const total = taxableValue + cgst + sgst + igst

    // Note: occurredAt doesn't exist in schema - using createdAt
    const occurredAt = firstEntry.createdAt
    
    lineItems.push({
      orderId,
      orderNumber,
      occurredAt,
      description: orderNumber
        ? `Platform fee for Order #${orderNumber}`
        : `Platform fee - ${occurredAt.toISOString().slice(0, 10)}`,
      sacCode: "9983", // SaaS services SAC code
      taxableValue: Math.round(taxableValue * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      total: Math.round(total * 100) / 100,
    })
  }

  // Calculate totals
  const totals: InvoiceTotals = {
    totalTaxable: Math.round(
      lineItems.reduce((sum, item) => sum + item.taxableValue, 0) * 100
    ) / 100,
    totalCgst:
      Math.round(lineItems.reduce((sum, item) => sum + item.cgst, 0) * 100) /
      100,
    totalSgst:
      Math.round(lineItems.reduce((sum, item) => sum + item.sgst, 0) * 100) /
      100,
    totalIgst:
      Math.round(lineItems.reduce((sum, item) => sum + item.igst, 0) * 100) /
      100,
    grandTotal:
      Math.round(lineItems.reduce((sum, item) => sum + item.total, 0) * 100) /
      100,
  }

  return { lineItems, totals, taxType }
}
