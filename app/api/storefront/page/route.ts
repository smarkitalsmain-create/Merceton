export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()

    const slug = typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : "home"
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Home"
    const layoutJson = body.layoutJson && typeof body.layoutJson === "object"
      ? body.layoutJson
      : { sections: [] }
    const isPublished = typeof body.isPublished === "boolean" ? body.isPublished : undefined

    // Basic validation: ensure sections is an array
    const sections = Array.isArray(layoutJson.sections) ? layoutJson.sections : []

    const data: any = {
      title,
      layoutJson: { sections },
    }

    if (isPublished !== undefined) {
      data.isPublished = isPublished
      data.publishedAt = isPublished ? new Date() : null
    }

    await prisma.storefrontPage.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug,
        },
      },
      update: data,
      create: {
        merchantId: merchant.id,
        slug,
        title,
        layoutJson: { sections },
        isPublished: isPublished ?? true,
        publishedAt: isPublished ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Storefront page save error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to save storefront page" },
      { status: 500 }
    )
  }
}

