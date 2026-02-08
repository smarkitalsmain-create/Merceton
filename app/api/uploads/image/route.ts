import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireMerchant()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Get Cloudinary credentials
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      )
    }

    // Generate timestamp and signature
    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(`timestamp=${timestamp}`)
      .digest("hex")

    // Convert File to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary using base64
    const uploadFormData = new URLSearchParams()
    uploadFormData.append("file", dataUri)
    uploadFormData.append("api_key", apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("folder", "sellarity")

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: uploadFormData.toString(),
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error("Cloudinary upload error:", error)
      return NextResponse.json(
        { error: "Failed to upload image to Cloudinary" },
        { status: 500 }
      )
    }

    const result = await uploadResponse.json()

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error: any) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    )
  }
}
