import { Decimal } from "@prisma/client/runtime/library"

/**
 * Aggregated invoice line item (grouped by order or day)
 */
export interface InvoiceLineItem {
  orderId: string | null
  orderNumber: string | null
  occurredAt: Date
  description: string
  sacCode: string // Service Accounting Code
  taxableValue: number // Base amount before GST
  cgst: number
  sgst: number
  igst: number
  total: number // taxableValue + cgst + sgst + igst
}

/**
 * Invoice totals
 */
export interface InvoiceTotals {
  totalTaxable: number
  totalCgst: number
  totalSgst: number
  totalIgst: number
  grandTotal: number
}

/**
 * Complete invoice data for PDF generation
 */
export interface BillingInvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  periodFrom: Date
  periodTo: Date

  // Supplier (Merceton)
  supplier: {
    legalName: string
    address: string
    city: string
    state: string
    pincode: string
    gstin: string
    stateCode: string // 2-digit state code
    email: string
    phone: string
  }

  // Recipient (Merchant)
  recipient: {
    legalName: string
    tradeName: string | null
    address: string
    city: string
    state: string
    pincode: string
    gstin: string | null
    stateCode: string | null
    email: string
    phone: string
  }

  // Line items
  lineItems: InvoiceLineItem[]
  totals: InvoiceTotals

  // Tax type used (CGST+SGST or IGST)
  taxType: "CGST_SGST" | "IGST"
}
