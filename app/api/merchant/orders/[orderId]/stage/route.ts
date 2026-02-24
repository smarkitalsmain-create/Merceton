import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { authUserId: user.id },
      include: { merchant: true },
    })

    if (!dbUser?.merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const targetStage: string | undefined = body.stage
    const reason: string | undefined = body.reason

    if (!targetStage) {
      return NextResponse.json(
        { error: "Target stage is required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        merchantId: dbUser.merchant.id,
      },
      include: {
        shipments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const currentStage = order.stage
    const allowedTargets = ALLOWED_TRANSITIONS[currentStage] || []

    if (!allowedTargets.includes(targetStage)) {
      return NextResponse.json(
        {
          error: `Invalid stage transition from ${currentStage} to ${targetStage}`,
        },
        { status: 400 }
      )
    }

    // Extra business rules
    if (targetStage === "CANCELLED") {
      if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(currentStage)) {
        return NextResponse.json(
          { error: "Cannot cancel an order after it has been shipped" },
          { status: 400 }
        )
      }
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          { error: "Cancellation reason is required" },
          { status: 400 }
        )
      }
    }

    if (targetStage === "SHIPPED") {
      const hasShipmentWithAwb = order.shipments.some(
        (s) => s.awb && s.awb.trim().length > 0
      )
      if (!hasShipmentWithAwb) {
        return NextResponse.json(
          {
            error:
              "Cannot mark as SHIPPED without shipment details (courier and AWB)",
          },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          stage: targetStage as any,
          status:
            targetStage === "CANCELLED"
              ? "CANCELLED"
              : targetStage === "DELIVERED"
              ? "DELIVERED"
              : order.status,
        },
      })

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "STAGE_CHANGE",
          message:
            targetStage === "CANCELLED"
              ? `Order cancelled: ${reason}`
              : `Stage changed from ${currentStage} to ${targetStage}`,
          oldValue: { stage: currentStage },
          newValue: { stage: targetStage },
          createdBy: "MERCHANT",
        },
      })

      return updatedOrder
    })

    // Email trigger: Shipment update (non-blocking)
    // Send shipment notification when order stage transitions to SHIPPED
    if (currentStage !== "SHIPPED" && targetStage === "SHIPPED") {
      try {
        const shipment = await prisma.shipment.findFirst({
          where: { orderId: order.id },
          orderBy: { createdAt: "desc" },
        });

        if (shipment && order.customerEmail && order.customerEmail.trim()) {
          const { sendShipmentUpdateEmail } = await import("@/lib/email/notifications");
          const merchant = await prisma.merchant.findUnique({
            where: { id: order.merchantId },
            select: { displayName: true },
          });

          await sendShipmentUpdateEmail({
            to: order.customerEmail,
            customerName: order.customerName,
            orderId: order.id, // Internal ID for tracking
            orderNumber: order.orderNumber, // Human-readable for display
            carrier: shipment.courierName,
            trackingId: shipment.awb,
            trackingUrl: shipment.trackingUrl || undefined,
            storeName: merchant?.displayName,
          });
        }
      } catch (emailError) {
        console.error("[email] Failed to send shipment update:", emailError);
      }
    }

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    console.error("Merchant order stage update error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update order stage" },
      { status: 500 }
    )
  }
}

