import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allocatePlatformInvoiceNumber } from "@/lib/billing/allocatePlatformInvoiceNumber"
import { computePlatformFeesForPeriod } from "@/lib/billing/computePlatformFees"
import { Decimal } from "@prisma/client/runtime/library"
import { logError } from "@/lib/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/jobs/generate-platform-invoices
 * 
 * Weekly job to generate platform invoices every Thursday.
 * 
 * Security: Requires X-CRON-SECRET header matching CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("X-CRON-SECRET")
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      logError("jobs-generate-platform-invoices", "CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 })
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine current cycle period
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 4 = Thursday

    // Calculate period end (this Thursday 23:59:59)
    let periodEnd = new Date(now)
    if (dayOfWeek < 4) {
      // Before Thursday, go to last Thursday
      periodEnd.setDate(now.getDate() - ((dayOfWeek + 3) % 7))
    } else if (dayOfWeek > 4) {
      // After Thursday, go to next Thursday
      periodEnd.setDate(now.getDate() + (4 - dayOfWeek))
    }
    periodEnd.setHours(23, 59, 59, 999)

    // Calculate period start (previous Friday 00:00:00)
    const periodStart = new Date(periodEnd)
    periodStart.setDate(periodEnd.getDate() - 6) // Go back 6 days to Friday
    periodStart.setHours(0, 0, 0, 0)

    // Get or create settlement cycle
    let cycle = await prisma.platformSettlementCycle.findFirst({
      where: {
        periodStart,
        periodEnd,
      },
    })

    if (!cycle) {
      cycle = await prisma.platformSettlementCycle.create({
        data: {
          periodStart,
          periodEnd,
          status: "DRAFT",
        },
      })
    }

    // If already invoiced, skip
    if (cycle.status === "INVOICED" || cycle.status === "PAID") {
      return NextResponse.json({
        message: "Cycle already invoiced",
        cycleId: cycle.id,
        status: cycle.status,
      })
    }

    // Get platform billing profile
    const profile = await prisma.platformBillingProfile.findUnique({
      where: { id: "platform" },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Platform billing profile not configured" },
        { status: 500 }
      )
    }

    const defaultGstRate = profile.defaultGstRate.toNumber()
    const defaultSacCode = profile.defaultSacCode || "9983"

    // Get all active merchants
    const merchants = await prisma.merchant.findMany({
      where: {
        isActive: true,
        accountStatus: "ACTIVE",
      },
      select: {
        id: true,
      },
    })

    let invoicesCreated = 0
    let invoicesSkipped = 0

    // Generate invoices for each merchant
    for (const merchant of merchants) {
      try {
        // Compute platform fees for the period
        const fees = await computePlatformFeesForPeriod(
          merchant.id,
          periodStart,
          periodEnd,
          defaultGstRate
        )

        // Skip if zero billable amount
        if (fees.total.equals(0)) {
          invoicesSkipped++
          continue
        }

        // Allocate invoice number
        const { invoiceNumber } = await allocatePlatformInvoiceNumber()

        // Create invoice
        const invoice = await prisma.platformInvoice.create({
          data: {
            merchantId: merchant.id,
            cycleId: cycle.id,
            invoiceNumber,
            invoiceDate: new Date(),
            currency: "INR",
            subtotal: fees.platformFee,
            gstAmount: fees.gstAmount,
            total: fees.total,
            status: "ISSUED",
          },
        })

        // Create line item for platform fee
        await prisma.platformInvoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            type: "PLATFORM_FEE",
            description: `Platform service fee for period ${periodStart.toLocaleDateString("en-IN")} to ${periodEnd.toLocaleDateString("en-IN")}`,
            sacCode: defaultSacCode,
            quantity: new Decimal(1),
            unitPrice: fees.platformFee,
            amount: fees.platformFee,
            gstRate: new Decimal(defaultGstRate),
            gstAmount: fees.gstAmount,
            totalAmount: fees.total,
          },
        })

        invoicesCreated++
      } catch (error: any) {
        logError("jobs-generate-platform-invoices-merchant", { merchantId: merchant.id, error })
        // Continue with other merchants
      }
    }

    // Update cycle status
    await prisma.platformSettlementCycle.update({
      where: { id: cycle.id },
      data: {
        status: "INVOICED",
        invoiceGeneratedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      cycleId: cycle.id,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      invoicesCreated,
      invoicesSkipped,
    })
  } catch (error: any) {
    logError("jobs-generate-platform-invoices", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate invoices" },
      { status: 500 }
    )
  }
}
