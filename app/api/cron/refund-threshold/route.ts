import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { logError } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/cron/refund-threshold
 * 
 * Cron job to check refund thresholds and send alerts if breached.
 * 
 * Security: Requires X-CRON-SECRET header matching CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("X-CRON-SECRET");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET environment variable not set");
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params for period (defaults to last 24 hours)
    const url = new URL(request.url);
    const periodHours = Number(url.searchParams.get("periodHours") || "24");
    const threshold = Number(url.searchParams.get("threshold") || "10000"); // Default ₹10,000

    const periodStart = new Date();
    periodStart.setHours(periodStart.getHours() - periodHours);

    // Calculate refund totals for the period
    const refunds = await prisma.refund.findMany({
      where: {
        createdAt: {
          gte: periodStart,
        },
        status: "COMPLETED",
      },
      select: {
        amount: true,
      },
    });

    let refundTotal = new Decimal(0);
    for (const refund of refunds) {
      refundTotal = refundTotal.add(refund.amount);
    }

    const refundCount = refunds.length;
    const refundTotalNumber = refundTotal.toNumber();

    // Check if threshold is breached
    if (refundTotalNumber >= threshold) {
      try {
        const { sendOpsRefundThresholdAlert } = await import("@/lib/email/notifications");
        
        const periodLabel = periodHours === 24 ? "Last 24h" : `Last ${periodHours}h`;
        
        await sendOpsRefundThresholdAlert({
          periodLabel,
          refundCount,
          refundTotal: refundTotalNumber,
          threshold,
          currency: "₹",
          adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`,
        });

        return NextResponse.json({
          success: true,
          alertSent: true,
          periodLabel,
          refundCount,
          refundTotal: refundTotalNumber,
          threshold,
        });
      } catch (emailError) {
        logError("cron-refund-threshold-email", emailError);
        return NextResponse.json(
          { error: "Failed to send alert email" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      alertSent: false,
      periodLabel: periodHours === 24 ? "Last 24h" : `Last ${periodHours}h`,
      refundCount,
      refundTotal: refundTotalNumber,
      threshold,
      message: "Threshold not breached",
    });
  } catch (error: any) {
    logError("cron-refund-threshold", error);
    return NextResponse.json(
      { error: error?.message || "Failed to check refund threshold" },
      { status: 500 }
    );
  }
}
