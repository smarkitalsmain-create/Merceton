import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { logError } from "@/lib/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/jobs/execute-weekly-payouts
 * 
 * Weekly job to execute payouts every Friday.
 * Links payouts to platform invoices and settlement cycles.
 * 
 * Security: Requires X-CRON-SECRET header matching CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("X-CRON-SECRET")
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      logError("jobs-execute-weekly-payouts", "CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 })
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find latest cycle with status INVOICED and not paid
    const cycle = await prisma.platformSettlementCycle.findFirst({
      where: {
        status: "INVOICED",
      },
      orderBy: {
        periodEnd: "desc",
      },
      include: {
        invoices: {
            include: {
              merchant: {
                include: {
                  bankAccount: {
                    select: {
                      accountNumber: true,
                    },
                  },
                },
              },
            },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json({
        message: "No invoiced cycle found",
      })
    }

    let payoutsCreated = 0
    let payoutsSkipped = 0

    // Create payouts for each merchant with an invoice
    for (const invoice of cycle.invoices) {
      try {
        // Skip if invoice is cancelled
        if (invoice.status === "CANCELLED") {
          payoutsSkipped++
          continue
        }

        // Calculate merchant gross receipts for the period
        const orders = await prisma.order.findMany({
          where: {
            merchantId: invoice.merchantId,
            createdAt: {
              gte: cycle.periodStart,
              lte: cycle.periodEnd,
            },
            payment: {
              status: "PAID",
            },
            stage: {
              not: "CANCELLED",
            },
          },
          select: {
            grossAmount: true,
            platformFee: true,
            netPayable: true,
          },
        })

        // Sum net payable (gross - platform fee)
        let totalNetPayable = new Decimal(0)
        for (const order of orders) {
          totalNetPayable = totalNetPayable.add(order.netPayable || 0)
        }

        // Deduct platform invoice total
        const payoutAmount = totalNetPayable.sub(invoice.total)

        // Skip if payout amount is zero or negative
        if (payoutAmount.lte(0)) {
          payoutsSkipped++
          continue
        }

        // Check if payout already exists for this invoice
        const existingPayout = await prisma.payoutBatch.findFirst({
          where: {
            merchantId: invoice.merchantId,
            platformInvoiceId: invoice.id,
          },
        })

        if (existingPayout) {
          payoutsSkipped++
          continue
        }

        // Create payout batch
        const payout = await prisma.payoutBatch.create({
          data: {
            merchantId: invoice.merchantId,
            totalAmount: payoutAmount,
            status: "PENDING",
            cycleId: cycle.id,
            platformInvoiceId: invoice.id,
          },
        })

        // Mark invoice as PAID
        await prisma.platformInvoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
          },
        })

        // Email trigger: Payout processed (non-blocking)
        // Send payout confirmation email to merchant
        try {
          const merchantUser = await prisma.user.findFirst({
            where: { merchantId: invoice.merchantId },
            select: { email: true },
          });

          if (merchantUser?.email) {
            const { sendPayoutProcessedEmail } = await import("@/lib/email/notifications");
            const bankAccount = invoice.merchant.bankAccount;
            
            await sendPayoutProcessedEmail({
              to: merchantUser.email,
              merchantName: invoice.merchant.displayName,
              payoutId: payout.id,
              amount: payoutAmount.toNumber(),
              currency: "₹",
              payoutDate: new Date().toISOString(),
              bankLast4: bankAccount?.accountNumber?.slice(-4),
              settlementRef: cycle.id,
            });
          }
        } catch (emailError) {
          logError("jobs-execute-weekly-payouts-email", {
            merchantId: invoice.merchantId,
            error: emailError,
          });
        }

        payoutsCreated++
      } catch (error: any) {
        logError("jobs-execute-weekly-payouts-merchant", {
          merchantId: invoice.merchantId,
          error,
        })
        // Continue with other merchants
      }
    }

    // Update cycle status (remove payoutExecutedAt as it doesn't exist in schema)
    await prisma.platformSettlementCycle.update({
      where: { id: cycle.id },
      data: {
        status: "PAID",
      },
    })

    return NextResponse.json({
      success: true,
      cycleId: cycle.id,
      payoutsCreated,
      payoutsSkipped,
    })
  } catch (error: any) {
    logError("jobs-execute-weekly-payouts", error)
    return NextResponse.json(
      { error: error?.message || "Failed to execute payouts" },
      { status: 500 }
    )
  }
}
