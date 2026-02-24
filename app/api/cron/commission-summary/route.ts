import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/cron/commission-summary
 * 
 * Cron job to send commission summary emails to merchants.
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

    // Get query params for period (optional, defaults to last month)
    const url = new URL(request.url);
    const merchantId = url.searchParams.get("merchantId");
    const periodStart = url.searchParams.get("periodStart");
    const periodEnd = url.searchParams.get("periodEnd");

    // For now, scaffold with placeholder logic
    // TODO: Implement full analytics logic to calculate commission summary
    if (merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          users: {
            where: { role: "ADMIN" },
            take: 1,
          },
        },
      });

      if (merchant && merchant.users[0]?.email) {
        try {
          const { sendCommissionSummaryEmail } = await import("@/lib/email/notifications");
          
          // Placeholder data - replace with actual calculations
          await sendCommissionSummaryEmail({
            to: merchant.users[0].email,
            merchantName: merchant.displayName,
            periodLabel: periodStart && periodEnd 
              ? `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`
              : "Last Month",
            totalOrders: 0, // TODO: Calculate from orders
            grossSales: 0, // TODO: Calculate from orders
            platformFees: 0, // TODO: Calculate from ledger
            currency: "₹",
          });

          return NextResponse.json({
            success: true,
            message: `Commission summary email sent to merchant ${merchantId}`,
          });
        } catch (emailError) {
          logError("cron-commission-summary-email", emailError);
          return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Commission summary cron endpoint (scaffold)",
      note: "Provide merchantId query param to send test email",
    });
  } catch (error: any) {
    logError("cron-commission-summary", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process commission summary" },
      { status: 500 }
    );
  }
}
