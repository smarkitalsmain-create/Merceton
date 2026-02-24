import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Billing module temporarily disabled
 */
export async function GET() {
  return new Response("Billing module temporarily disabled", { status: 501 })
}
