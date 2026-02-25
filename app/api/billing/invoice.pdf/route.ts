import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { featureFlags } from "@/lib/featureFlags"
import { getPlatformBillingProfile } from "@/lib/billing/queries"
import { aggregateLedgerEntriesForInvoice } from "@/lib/billing/aggregate"
import { generateBillingInvoicePdf } from "@/lib/billing/generateInvoicePdf"
import { prisma } from "@/lib/prisma"
import { BillingInvoiceData } from "@/lib/billing/types"

export const runtime = "nodejs"

function getStateCode(state: string | null | undefined): string {
  if (!state) return "09"
  if (/^\d{2}$/.test(state)) return state
  const match = state.match(/\d{2}/)
  return match ? match[0] : "09"
}

/**
 * Merchant-only invoice PDF. Use session merchant; do not accept merchantId (admin should use /api/admin/billing/invoice.pdf).
 */
export async function GET(request: NextRequest) {
  if (!featureFlags.billingInvoicePdf) {
    return NextResponse.json(
      { error: "Billing invoice PDF is disabled by configuration" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  if (searchParams.has("merchantId")) {
    return NextResponse.json(
      { error: "merchantId is not allowed. Use your merchant session or admin endpoint for other merchants." },
      { status: 400 }
    )
  }

  let merchantId: string
  try {
    const merchant = await requireMerchant()
    merchantId = merchant.id
  } catch {
    return NextResponse.json(
      { error: "Unauthorized. Sign in as a merchant to download your invoice." },
      { status: 401 }
    )
  }

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const fromStr =
    fromParam ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const toStr = toParam ?? new Date().toISOString().slice(0, 10)
  const from = new Date(fromStr)
  const to = new Date(toStr)
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return NextResponse.json(
      { error: "Invalid from or to date. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }

  try {
    const [profile, merchant] = await Promise.all([
      getPlatformBillingProfile(),
      prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          onboarding: true,
        },
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
      invoiceNumber: `STMT-${fromStr}-${toStr}`,
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

    const filename = `billing-invoice-${merchantId.slice(-6)}-${fromStr}-${toStr}.pdf`
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (e) {
    console.error("[billing/invoice.pdf] error:", e)
    const message = e instanceof Error ? e.message : "Failed to generate PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
