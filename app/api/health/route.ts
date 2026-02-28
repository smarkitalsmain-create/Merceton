import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Lightweight health check: one DB roundtrip, returns latency.
 * GET /api/health → { ok: true, dbLatencyMs } or 500 with JSON error.
 */
export async function GET() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - start
    return NextResponse.json({ ok: true, dbLatencyMs }, { status: 200 })
  } catch (error: unknown) {
    const dbLatencyMs = Date.now() - start
    const message = error instanceof Error ? error.message : String(error)
    console.error("[health] DB check failed:", message)
    return NextResponse.json(
      { ok: false, error: message, dbLatencyMs },
      { status: 500 }
    )
  }
}
