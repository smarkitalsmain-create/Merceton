export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"

// Use CommonJS require() for Cloudinary - must be at top level, not inside function
const cloudinary = require("cloudinary").v2

// Configure Cloudinary (only runs in Node runtime)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

// Validation rules by kind
const VALIDATION_RULES = {
  logo: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  favicon: {
    maxSizeBytes: 512 * 1024, // 512KB
    allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/x-icon"],
  },
  banner: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  product: {
    maxSizeBytes: 8 * 1024 * 1024, // 8MB
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  generic: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
  },
} as const

export async function POST(request: NextRequest) {
  try {
    // Authenticate merchant
    let merchant
    try {
      const authResult = await authorizeRequest()
      merchant = authResult.merchant
    } catch (authError: any) {
      // Handle Response objects (503 from DB errors)
      if (authError instanceof Response) {
        const status = authError.status || 503
        const text = await authError.text().catch(() => "Service unavailable")
        return NextResponse.json(
          { error: text },
          { status }
        )
      }
      // Handle auth errors
      if (authError?.message?.includes("Merchant not found")) {
        return NextResponse.json(
          { error: "Merchant not found. Please complete store setup." },
          { status: 403 }
        )
      }
      if (authError?.message?.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in and try again." },
          { status: 401 }
        )
      }
      // Re-throw unexpected errors
      throw authError
    }

    // Validate Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Upload provider not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Read form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const kind = String(formData.get("kind") || "generic") as keyof typeof VALIDATION_RULES

    // Validate file exists
    if (!file) {
      console.error("Upload error: No file in formData")
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file is actually a File object
    if (!(file instanceof File)) {
      console.error("Upload error: file is not a File instance", {
        type: typeof file,
        constructor: (file as any)?.constructor?.name,
      })
      return NextResponse.json(
        { error: "Invalid file object" },
        { status: 400 }
      )
    }

    // Get validation rules for kind
    const rules = VALIDATION_RULES[kind] || VALIDATION_RULES.generic

    // Validate file type (cast to union type)
    const fileType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/x-icon"
    const validTypes = rules.allowedTypes as ReadonlyArray<string>
    if (!validTypes.includes(fileType)) {
      console.error("Upload error: Invalid file type", {
        type: file.type,
        allowed: rules.allowedTypes,
      })
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: ${rules.allowedTypes.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > rules.maxSizeBytes) {
      const maxSizeMB = (rules.maxSizeBytes / (1024 * 1024)).toFixed(1)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
      console.error("Upload error: File too large", {
        size: file.size,
        max: rules.maxSizeBytes,
      })
      return NextResponse.json(
        { error: `File too large: ${fileSizeMB}MB. Maximum size: ${maxSizeMB}MB` },
        { status: 413 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename to avoid collisions
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_") // Sanitize filename
    const filename = `${timestamp}-${originalName}`

    // Upload to Cloudinary using upload_stream
    const folder = `merceton/${merchant.id}/${kind}`

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          public_id: filename.split(".")[0], // Remove extension, Cloudinary adds it
          overwrite: false,
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(error)
          } else if (!result) {
            console.error("Cloudinary upload error: No result returned")
            reject(new Error("Cloudinary upload failed: No result returned"))
          } else {
            resolve(result)
          }
        }
      )

      // Write buffer to stream
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    })
  } catch (error: any) {
    console.error("Image upload error:", error)

    // Handle Response errors (503 from DB errors)
    if (error instanceof Response) {
      const status = error.status || 503
      try {
        const text = await error.text()
        return NextResponse.json(
          { error: text || "Service unavailable" },
          { status }
        )
      } catch {
        return NextResponse.json(
          { error: "Service unavailable" },
          { status }
        )
      }
    }

    // Handle Cloudinary config errors
    if (error?.message?.includes("Cloudinary configuration missing")) {
      return NextResponse.json(
        { error: "Upload provider not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Handle auth errors
    if (error?.message?.includes("Merchant not found")) {
      return NextResponse.json(
        { error: "Merchant not found. Please complete store setup." },
        { status: 403 }
      )
    }

    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in and try again." },
        { status: 401 }
      )
    }

    // Handle Cloudinary upload errors
    if (error?.message) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
