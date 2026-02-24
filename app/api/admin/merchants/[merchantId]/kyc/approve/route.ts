import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Admin module disabled
 */
export async function POST() {
  return new Response("Admin module disabled", { status: 501 })
}
