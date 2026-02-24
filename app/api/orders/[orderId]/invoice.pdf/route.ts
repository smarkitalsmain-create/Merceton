import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildInvoiceData } from "@/lib/storefront/invoicing/buildInvoiceData"
import { generateInvoicePdf } from "@/lib/storefront/invoicing/pdf/generateInvoicePdf"
import { allocateInvoiceNumberForOrder } from "@/lib/storefront/invoicing/allocateInvoiceNumber"

// Force Node.js runtime (not Edge) for PDFKit compatibility
export const runtime = "nodejs"

/**
 * Generate and download invoice PDF for an order
 * 
 * GET /api/orders/[orderId]/invoice.pdf
 * 
 * Security:
 * - Requires merchant authentication
 * - Validates order belongs to merchant
 * - Returns PDF with proper headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const merchant = await requireMerchant()

    // Fetch order with all relations
    let order
    try {
      order = await prisma.order.findFirst({
        where: {
          id: params.orderId,
          merchantId: merchant.id,
        },
        include: {
          items: true, // Don't include product relation - use snapshot data only
          merchant: true,
          payment: true,
        },
      })
    } catch (dbError: any) {
      const isConnectionError =
        dbError.code === "P1001" ||
        dbError.code === "P1002" ||
        dbError.code === "P1003" ||
        dbError.message?.includes("Can't reach database") ||
        dbError.message?.includes("connection") ||
        dbError.message?.includes("ECONNREFUSED") ||
        dbError.message?.includes("ETIMEDOUT")

      if (isConnectionError) {
        console.error("DB connection error in invoice route:", dbError)
        return new Response("Service temporarily unavailable", { status: 503 })
      }
      throw dbError
    }

    if (!order) {
      return new Response("Order not found", { status: 404 })
    }

    // Fetch tax profile (if exists - you may need to create this model)
    // For now, we'll use a placeholder that checks merchant onboarding
    let onboarding = null
    try {
      onboarding = await prisma.merchantOnboarding.findUnique({
        where: { merchantId: merchant.id },
      })
    } catch (dbError: any) {
      // If onboarding fetch fails, continue without tax profile
      console.warn("Failed to fetch onboarding data:", dbError)
    }

    const taxProfile = onboarding
      ? {
          isGstRegistered: onboarding.gstStatus === "REGISTERED",
          gstin: onboarding.gstin,
          legalName: onboarding.gstLegalName || onboarding.legalBusinessName,
          tradeName: onboarding.gstTradeName || onboarding.storeDisplayName,
          addressLine1: null, // Add to onboarding or separate table
          addressLine2: null,
          city: null,
          state: onboarding.gstState,
          stateCode: null,
          pincode: null,
          email: null,
          phone: null,
        }
      : null

    // Allocate invoice number using latest settings (transaction-safe)
    // This ensures PDF uses the same invoice number allocation logic as HTML invoice
    let invoiceNumber: string
    let invoiceIssuedAt: Date
    try {
      const result = await allocateInvoiceNumberForOrder(order.id, merchant.id)
      invoiceNumber = result.invoiceNumber
      invoiceIssuedAt = result.invoiceIssuedAt
    } catch (dbError: any) {
      const isConnectionError =
        dbError.code === "P1001" ||
        dbError.code === "P1002" ||
        dbError.code === "P1003" ||
        dbError.message?.includes("Can't reach database") ||
        dbError.message?.includes("connection") ||
        dbError.message?.includes("ECONNREFUSED") ||
        dbError.message?.includes("ETIMEDOUT")

      if (isConnectionError) {
        console.error("DB connection error while allocating invoice number:", dbError)
        return new Response("Service temporarily unavailable", { status: 503 })
      }
      // If invoice number allocation fails, use order number as fallback
      invoiceNumber = order.invoiceNumber || order.orderNumber
      invoiceIssuedAt = order.invoiceIssuedAt || order.createdAt
      console.warn("Failed to allocate invoice number, using existing or order number:", dbError)
    }

    // Build invoice data
    const invoiceData = buildInvoiceData(order, taxProfile, invoiceNumber)

    // Generate PDF using PDFKit
    const pdfBuffer = await generateInvoicePdf(invoiceData)

    // Convert Buffer to Uint8Array for Response
    const pdfArray = new Uint8Array(pdfBuffer)

    // Return PDF with proper headers
    return new Response(pdfArray, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("Invoice PDF generation error:", error)

    // Handle Response objects (from requireMerchant)
    if (error instanceof Response) {
      return error
    }

    // Check if it's a DB connection error
    const isConnectionError =
      error.code === "P1001" ||
      error.code === "P1002" ||
      error.code === "P1003" ||
      error.message?.includes("Can't reach database") ||
      error.message?.includes("connection") ||
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("ETIMEDOUT")

    if (isConnectionError) {
      return new Response("Service temporarily unavailable", { status: 503 })
    }

    // Other errors (PDF generation, font errors, etc.)
    // Return exact error message for font errors
    const errorMessage = error?.message || "Unknown error"
    return new Response(String(errorMessage), { status: 500 })
  }
}
