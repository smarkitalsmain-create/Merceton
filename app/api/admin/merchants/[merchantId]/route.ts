import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/admin/merchants/[merchantId]
 * Returns single merchant for admin (e.g. billing page needs displayName, onboarding).
 */
export async function GET(
  _request: Request,
  context: { params: { merchantId: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminMerchants) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }

  const merchantId = context.params.merchantId
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        onboarding: {
          select: {
            gstin: true,
            gstState: true,
            invoiceState: true,
            legalBusinessName: true,
            gstLegalName: true,
            invoiceAddressLine1: true,
            invoiceAddressLine2: true,
            invoiceCity: true,
            invoicePincode: true,
            invoiceEmail: true,
            invoicePhone: true,
          },
        },
      },
    })

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        displayName: merchant.displayName,
        isActive: merchant.isActive,
        accountStatus: merchant.accountStatus,
        kycStatus: merchant.kycStatus,
        onboarding: merchant.onboarding,
      },
    })
  } catch (e) {
    console.error("[admin/merchants/[merchantId]] GET error:", e)
    const message = e instanceof Error ? e.message : "Failed to load merchant"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
