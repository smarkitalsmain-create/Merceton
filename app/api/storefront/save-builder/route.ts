import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { builderJson, builderHtml, builderCss } = body

    // Validate data
    if (!builderJson && !builderHtml) {
      return NextResponse.json(
        { error: "Builder data is required" },
        { status: 400 }
      )
    }

    // Upsert storefront settings
    const storefront = await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      update: {
        builderJson: builderJson || null,
        builderHtml: builderHtml || null,
        builderCss: builderCss || null,
        mode: "CUSTOM_CODE", // Set mode to CUSTOM_CODE when using builder
      },
      create: {
        merchantId: merchant.id,
        builderJson: builderJson || null,
        builderHtml: builderHtml || null,
        builderCss: builderCss || null,
        mode: "CUSTOM_CODE",
      },
      select: {
        id: true,
        builderJson: true,
        builderHtml: true,
        builderCss: true,
        mode: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      storefront,
      message: "Draft saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving builder draft:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save draft" },
      { status: 500 }
    )
  }
}
