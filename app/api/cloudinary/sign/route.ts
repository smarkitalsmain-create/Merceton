export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    const missingEnv: string[] = []
    if (!cloudName) missingEnv.push("CLOUDINARY_CLOUD_NAME")
    if (!apiKey) missingEnv.push("CLOUDINARY_API_KEY")
    if (!apiSecret) missingEnv.push("CLOUDINARY_API_SECRET")

    if (missingEnv.length > 0) {
      console.error(
        `Cloudinary configuration missing env vars: ${missingEnv.join(", ")}`
      )
      return NextResponse.json(
        { error: "Missing CLOUDINARY env vars" },
        { status: 500 }
      )
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = "merceton/products"

    // Cloudinary signed params: folder=merceton/products&timestamp=<ts><apiSecret>
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

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

