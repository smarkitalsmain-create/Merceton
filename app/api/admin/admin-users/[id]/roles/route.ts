import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Admin user roles endpoint not configured yet." },
    { status: 503 }
  )
}

