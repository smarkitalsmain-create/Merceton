import { NextResponse } from "next/server"
import { featureFlags } from "@/lib/featureFlags"

export const runtime = "nodejs"

/**
 * Merchant billing statement CSV. Requires merchant auth at route level if needed.
 * Stub: returns 501 until implemented.
 */
export async function GET() {
  if (!featureFlags.billingStatement) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 }
  )
}
