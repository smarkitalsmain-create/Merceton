import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { getPlatformBillingProfile } from "@/lib/billing/queries"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export const runtime = "nodejs"

function toNumber(d: unknown): number {
  if (d == null) return 0
  if (typeof d === "number") return d
  if (typeof d === "string") return parseFloat(d) || 0
  if (Decimal.isDecimal(d)) return Number(d)
  return 0
}

export async function GET() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminBillingProfile) {
    return NextResponse.json(
      { error: "Billing profile is disabled by configuration", errorCode: "FEATURE_DISABLED" },
      { status: 503 }
    )
  }
  try {
    const profile = await getPlatformBillingProfile()
    return NextResponse.json({
      id: profile.id,
      legalName: profile.legalName,
      gstin: profile.gstin ?? null,
      addressLine1: profile.addressLine1 ?? null,
      addressLine2: profile.addressLine2 ?? null,
      city: profile.city ?? null,
      state: profile.state ?? null,
      pincode: profile.pincode ?? null,
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      invoicePrefix: profile.invoicePrefix,
      invoiceNextNumber: profile.invoiceNextNumber,
      invoicePadding: profile.invoicePadding,
      seriesFormat: profile.seriesFormat,
      defaultSacCode: profile.defaultSacCode,
      defaultGstRate: toNumber(profile.defaultGstRate),
      footerNote: profile.footerNote ?? null,
    })
  } catch (e) {
    console.error("[billing-profile] GET error:", e)
    const message = e instanceof Error ? e.message : "Failed to load billing profile"
    return NextResponse.json(
      { error: message, errorCode: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminBillingProfile) {
    return NextResponse.json(
      { error: "Billing profile is disabled by configuration", errorCode: "FEATURE_DISABLED" },
      { status: 503 }
    )
  }
  try {
    const body = await request.json()
    const profile = await getPlatformBillingProfile()
    const updated = await prisma.platformBillingProfile.update({
      where: { id: "platform" },
      data: {
        legalName: body.legalName ?? profile.legalName,
        gstin: body.gstin !== undefined ? body.gstin : profile.gstin,
        addressLine1: body.addressLine1 !== undefined ? body.addressLine1 : profile.addressLine1,
        addressLine2: body.addressLine2 !== undefined ? body.addressLine2 : profile.addressLine2,
        city: body.city !== undefined ? body.city : profile.city,
        state: body.state !== undefined ? body.state : profile.state,
        pincode: body.pincode !== undefined ? body.pincode : profile.pincode,
        email: body.email !== undefined ? body.email : profile.email,
        phone: body.phone !== undefined ? body.phone : profile.phone,
        invoicePrefix: body.invoicePrefix ?? profile.invoicePrefix,
        invoiceNextNumber: body.invoiceNextNumber != null ? Number(body.invoiceNextNumber) : profile.invoiceNextNumber,
        invoicePadding: body.invoicePadding != null ? Number(body.invoicePadding) : profile.invoicePadding,
        seriesFormat: body.seriesFormat ?? profile.seriesFormat,
        defaultSacCode: body.defaultSacCode ?? profile.defaultSacCode,
        defaultGstRate: body.defaultGstRate != null ? new Decimal(Number(body.defaultGstRate)) : profile.defaultGstRate,
        footerNote: body.footerNote !== undefined ? body.footerNote : profile.footerNote,
      },
    })
    return NextResponse.json({
      id: updated.id,
      legalName: updated.legalName,
      gstin: updated.gstin ?? null,
      addressLine1: updated.addressLine1 ?? null,
      addressLine2: updated.addressLine2 ?? null,
      city: updated.city ?? null,
      state: updated.state ?? null,
      pincode: updated.pincode ?? null,
      email: updated.email ?? null,
      phone: updated.phone ?? null,
      invoicePrefix: updated.invoicePrefix,
      invoiceNextNumber: updated.invoiceNextNumber,
      invoicePadding: updated.invoicePadding,
      seriesFormat: updated.seriesFormat,
      defaultSacCode: updated.defaultSacCode,
      defaultGstRate: toNumber(updated.defaultGstRate),
      footerNote: updated.footerNote ?? null,
    })
  } catch (e) {
    console.error("[billing-profile] POST error:", e)
    const message = e instanceof Error ? e.message : "Failed to save billing profile"
    return NextResponse.json(
      { error: message, errorCode: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}
