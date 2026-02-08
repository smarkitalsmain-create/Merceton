import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Create signature: HMAC-SHA1 of "timestamp=<timestamp>"
    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(`timestamp=${timestamp}`)
      .digest("hex")

    return NextResponse.json({
      timestamp,
      signature,
      apiKey,
      cloudName,
    })
  } catch (error) {
    console.error("Cloudinary sign error:", error)
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    )
  }
}
