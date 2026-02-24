import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

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
    const courierName: string | undefined = body.courierName
    const awb: string | undefined = body.awb
    const trackingUrl: string | undefined = body.trackingUrl

    if (!courierName || !awb) {
      return NextResponse.json(
        { error: "courierName and awb are required" },
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

    if (order.stage === "CANCELLED" || order.stage === "RETURNED") {
      return NextResponse.json(
        { error: "Cannot add shipment for cancelled or returned orders" },
        { status: 400 }
      )
    }

    const now = new Date()

    const updated = await prisma.$transaction(async (tx) => {
      const existingShipment = order.shipments[0]

      if (existingShipment) {
        await tx.shipment.update({
          where: { id: existingShipment.id },
          data: {
            courierName,
            awb,
            trackingUrl,
            shippedAt: existingShipment.shippedAt ?? now,
          },
        })
      } else {
        await tx.shipment.create({
          data: {
            orderId: order.id,
            courierName,
            awb,
            trackingUrl,
            shippedAt: now,
          },
        })
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          stage: order.stage === "PACKED" ? "SHIPPED" : order.stage,
        },
      })

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "SYSTEM",
          message: `Shipment updated (${courierName}, AWB: ${awb})`,
          // Omit oldValue when there's no previous value (optional Json? field)
          newValue: { courierName, awb, trackingUrl },
          createdBy: "MERCHANT",
        },
      })

      if (order.stage === "PACKED") {
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            type: "STAGE_CHANGE",
            message: `Stage changed from PACKED to SHIPPED`,
            oldValue: { stage: "PACKED" },
            newValue: { stage: "SHIPPED" },
            createdBy: "MERCHANT",
          },
        })
      }

      return updatedOrder
    })

    // Email trigger: Shipment update (non-blocking)
    // Send shipment notification when order stage transitions to SHIPPED
    if (order.stage === "PACKED" && updated.stage === "SHIPPED") {
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
    console.error("Merchant order shipment error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update shipment" },
      { status: 500 }
    )
  }
}

