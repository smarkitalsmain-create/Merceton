import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import crypto from "crypto"

export const runtime = "nodejs"

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

    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be PDF, JPG, or PNG" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
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
    const folder = "sellarity/bank-proofs"
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

    // Convert File to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    // Use raw upload for PDFs, image upload for images
    const resourceType = file.type === "application/pdf" ? "raw" : "image"
    const uploadFormData = new URLSearchParams()
    uploadFormData.append("file", dataUri)
    uploadFormData.append("api_key", apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("folder", folder)

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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
        { error: "Failed to upload document to Cloudinary" },
        { status: 500 }
      )
    }

    const result = await uploadResponse.json()

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error: any) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    )
  }
}
