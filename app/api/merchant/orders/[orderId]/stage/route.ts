import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
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
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      include: { merchant: true },
    })

    if (!user?.merchant) {
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
        merchantId: user.merchant.id,
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

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    console.error("Merchant order stage update error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update order stage" },
      { status: 500 }
    )
  }
}

