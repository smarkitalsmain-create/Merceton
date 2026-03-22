import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Admin user creation endpoint not configured yet." },
    { status: 503 }
  )
}

