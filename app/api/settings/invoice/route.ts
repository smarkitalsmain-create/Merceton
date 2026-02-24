import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"

/**
 * GET /api/settings/invoice
 * Fetch invoice settings for the authenticated merchant
 */
export async function GET() {
  try {
    const merchant = await requireMerchant()

    // Fetch store settings
    const storeSettings = await prisma.merchantStoreSettings.findUnique({
      where: { merchantId: merchant.id },
      select: {
        invoicePrefix: true,
        invoiceNextNumber: true,
        invoicePadding: true, // Note: schema field is invoicePadding
        invoiceSeriesFormat: true,
        logoUrl: true,
      },
    })

    // Also fetch storefront logo as fallback
    const storefrontSettings = await prisma.storefrontSettings.findUnique({
      where: { merchantId: merchant.id },
      select: {
        logoUrl: true,
      },
    })

    const logoUrl = storeSettings?.logoUrl || storefrontSettings?.logoUrl || null

    return NextResponse.json({
      invoicePrefix: storeSettings?.invoicePrefix || "MRC",
      invoiceNextNumber: storeSettings?.invoiceNextNumber || 1,
      invoiceNumberPadding: storeSettings?.invoicePadding || 5, // Map invoicePadding to invoiceNumberPadding for API compatibility
      invoiceSeriesFormat: storeSettings?.invoiceSeriesFormat || "{PREFIX}-{YYYY}-{NNNNN}",
      logoUrl,
    })
  } catch (error: any) {
    console.error("Get invoice settings error:", error)
    if (error instanceof Response) {
      return error // Return auth error as-is
    }
    return NextResponse.json(
      { error: "Failed to fetch invoice settings" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/invoice
 * Update invoice settings for the authenticated merchant
 */
export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    // Parse request body
    const body = await request.json()

    // Manual validation
    const errors: string[] = []

    // Validate invoicePrefix
    if (!body.invoicePrefix || typeof body.invoicePrefix !== "string" || body.invoicePrefix.trim().length === 0) {
      errors.push("Prefix is required")
    } else if (body.invoicePrefix.length > 10) {
      errors.push("Prefix must be 10 characters or less")
    }

    // Validate invoiceNextNumber
    const nextNumber = typeof body.invoiceNextNumber === "number"
      ? body.invoiceNextNumber
      : parseInt(String(body.invoiceNextNumber || "1"), 10)

    if (isNaN(nextNumber) || nextNumber < 1) {
      errors.push("Next invoice number must be at least 1")
    }

    // Validate invoiceNumberPadding
    const padding = typeof body.invoiceNumberPadding === "number"
      ? body.invoiceNumberPadding
      : parseInt(String(body.invoiceNumberPadding || "5"), 10)

    if (isNaN(padding) || padding < 3 || padding > 8) {
      errors.push("Number padding must be between 3 and 8")
    }

    // Validate invoiceSeriesFormat (if provided)
    if (body.invoiceSeriesFormat && typeof body.invoiceSeriesFormat === "string" && body.invoiceSeriesFormat.trim().length > 0) {
      if (!body.invoiceSeriesFormat.includes("{NNNNN}")) {
        errors.push("Series format must include {NNNNN} token")
      }
    }

    // Return validation errors
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors[0] },
        { status: 400 }
      )
    }

    // Prepare validated data (map invoiceNumberPadding to invoicePadding)
    const validatedData = {
      invoicePrefix: String(body.invoicePrefix).trim().toUpperCase(),
      invoiceNextNumber: nextNumber,
      invoicePadding: padding, // Schema field is invoicePadding
      invoiceSeriesFormat: body.invoiceSeriesFormat?.trim() || "{PREFIX}-{YYYY}-{NNNNN}",
    }

    // Upsert store settings
    await prisma.merchantStoreSettings.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        storeName: merchant.displayName, // Required field
        ...validatedData,
      },
      update: validatedData,
    })

    revalidatePath("/dashboard/settings/invoice")

    return NextResponse.json({
      success: true,
      ...validatedData,
    })
  } catch (error: any) {
    console.error("Update invoice settings error:", error)
    if (error instanceof Response) {
      return error // Return auth error as-is
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update invoice settings" },
      { status: 500 }
    )
  }
}
