import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Health Check Route
 *
 * Tests database connectivity and access to core models (including tickets).
 * Used for monitoring and deployment verification.
 *
 * GET /api/health
 *
 * Returns:
 * - 200 { status: "ok" } on success
 * - 500 { status: "error", error: string } on failure (e.g. missing table)
 */
export async function GET() {
  try {
    await prisma.$connect()

    // Lightweight checks for core tables (minimal query cost)
    await Promise.all([
      prisma.user.findFirst({ select: { id: true }, take: 1 }),
      prisma.merchant.findFirst({ select: { id: true }, take: 1 }),
      prisma.order.findFirst({ select: { id: true }, take: 1 }),
      prisma.product.findFirst({ select: { id: true }, take: 1 }),
      prisma.orderNumberCounter.findFirst({ take: 1 }),
      // Ensure tickets table exists; missing table causes prisma.ticket to throw
      prisma.ticket.findFirst({ select: { id: true }, take: 1 }),
    ])

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; errorCode?: string }
    const errorMessage = err?.message ?? String(error)
    const errorCode = err?.code ?? err?.errorCode ?? "UNKNOWN"

    const isMissingTable =
      errorMessage.includes("does not exist") ||
      errorMessage.includes("tickets") ||
      errorCode === "P2021" // Prisma: "The table does not exist"

    const responseError = isMissingTable
      ? "Database schema missing: tickets table does not exist. Run: npx prisma migrate deploy"
      : errorMessage

    console.error("[Health Check] Database health check failed:", {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        status: "error",
        error: responseError,
      },
      { status: 500 }
    )
  }
}
