import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Health Check Route
 * 
 * Tests database connectivity and access to core models.
 * Used for monitoring and deployment verification.
 * 
 * GET /api/health
 * 
 * Returns:
 * - 200 { status: "ok" } on success
 * - 500 { status: "error", error: string } on failure
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()

    // Test access to core models with minimal queries
    // Using findFirst() with take: 1 to minimize query cost
    
    await Promise.all([
      prisma.user.findFirst({ take: 1 }),
      prisma.merchant.findFirst({ take: 1 }),
      prisma.order.findFirst({ take: 1 }),
      prisma.product.findFirst({ take: 1 }),
      prisma.orderNumberCounter.findFirst({ take: 1 }),
    ])

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (error: any) {
    // Log error details for debugging
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || error?.errorCode || "UNKNOWN"
    
    console.error("[Health Check] Database health check failed:", {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
