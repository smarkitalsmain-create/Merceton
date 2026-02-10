export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      console.error("Cloudinary configuration missing")
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = `sellarity/merchant-${merchant.id}`

    // Cloudinary signed params: folder=<folder>&timestamp=<timestamp>
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`

    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(stringToSign)
      .digest("hex")

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    })
  } catch (error: any) {
    console.error("Cloudinary sign error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate Cloudinary signature" },
      { status: 500 }
    )
  }
}

