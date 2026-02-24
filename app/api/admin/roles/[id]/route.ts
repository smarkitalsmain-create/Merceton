import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Admin module disabled
 */
export async function GET() {
  return new Response("Admin module disabled", { status: 501 })
}

export async function PUT() {
  return new Response("Admin module disabled", { status: 501 })
}

export async function DELETE() {
  return new Response("Admin module disabled", { status: 501 })
}
