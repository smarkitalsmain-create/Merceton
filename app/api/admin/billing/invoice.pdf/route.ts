import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { getPlatformBillingProfile } from "@/lib/billing/queries"
import { aggregateLedgerEntriesForInvoice } from "@/lib/billing/aggregate"
import { generateBillingInvoicePdf } from "@/lib/billing/generateInvoicePdf"
import { prisma } from "@/lib/prisma"
import { BillingInvoiceData } from "@/lib/billing/types"

export const runtime = "nodejs"

const MAX_RANGE_DAYS = 90

function getStateCode(state: string | null | undefined): string {
  if (!state) return "09"
  if (/^\d{2}$/.test(state)) return state
  const match = state.match(/\d{2}/)
  return match ? match[0] : "09"
}

/**
 * GET /api/admin/billing/invoice.pdf
 * Admin-only. Query params: merchantId (required), from (YYYY-MM-DD), to (YYYY-MM-DD).
 * Max range 90 days. Returns application/pdf.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get("merchantId")?.trim()
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (!merchantId || merchantId.length < 10) {
    return NextResponse.json(
      { error: "merchantId is required and must be a valid id" },
      { status: 400 }
    )
  }
  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "from and to date parameters are required (YYYY-MM-DD)" },
      { status: 400 }
    )
  }

  const from = new Date(fromParam)
  const to = new Date(toParam)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { error: "Invalid from or to date. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }
  if (from > to) {
    return NextResponse.json(
      { error: "from must be before or equal to to" },
      { status: 400 }
    )
  }
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Date range must not exceed ${MAX_RANGE_DAYS} days` },
      { status: 400 }
    )
  }

  try {
    const [profile, merchant] = await Promise.all([
      getPlatformBillingProfile(),
      prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { onboarding: true },
      }),
    ])

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    const gstRate = Number(profile.defaultGstRate) || 18
    const supplierStateCode = getStateCode(profile.state)
    const recipientState = merchant.onboarding?.gstState ?? merchant.onboarding?.invoiceState ?? null
    const recipientStateCode = getStateCode(recipientState)

    const { lineItems, totals, taxType } = await aggregateLedgerEntriesForInvoice(
      merchantId,
      from,
      to,
      supplierStateCode,
      recipientStateCode,
      gstRate
    )

    const supplierAddress = [profile.addressLine1, profile.addressLine2].filter(Boolean).join(", ") || "—"
    const recipientAddress = merchant.onboarding
      ? [merchant.onboarding.invoiceAddressLine1, merchant.onboarding.invoiceAddressLine2].filter(Boolean).join(", ") || "—"
      : "—"

    const data: BillingInvoiceData = {
      invoiceNumber: `STMT-${fromParam}-${toParam}`,
      invoiceDate: new Date(),
      periodFrom: from,
      periodTo: to,
      supplier: {
        legalName: profile.legalName,
        address: supplierAddress,
        city: profile.city ?? "",
        state: profile.state ?? "",
        pincode: profile.pincode ?? "",
        gstin: profile.gstin ?? "",
        stateCode: supplierStateCode,
        email: profile.email ?? "",
        phone: profile.phone ?? "",
      },
      recipient: {
        legalName: merchant.onboarding?.gstLegalName ?? merchant.onboarding?.legalBusinessName ?? merchant.displayName,
        tradeName: merchant.onboarding?.gstTradeName ?? merchant.onboarding?.storeDisplayName ?? null,
        address: recipientAddress,
        city: merchant.onboarding?.invoiceCity ?? "",
        state: merchant.onboarding?.gstState ?? merchant.onboarding?.invoiceState ?? "",
        pincode: merchant.onboarding?.invoicePincode ?? "",
        gstin: merchant.onboarding?.gstin ?? null,
        stateCode: recipientStateCode || null,
        email: merchant.onboarding?.invoiceEmail ?? "",
        phone: merchant.onboarding?.invoicePhone ?? "",
      },
      lineItems,
      totals,
      taxType,
    }

    const pdfBuffer = await generateBillingInvoicePdf(data)
    const pdfArray = new Uint8Array(pdfBuffer)
    const filename = `platform-invoice-${merchantId}-${fromParam}-${toParam}.pdf`

    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (e) {
    console.error("[admin/billing/invoice.pdf] error:", e)
    const message = e instanceof Error ? e.message : "Failed to generate PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
