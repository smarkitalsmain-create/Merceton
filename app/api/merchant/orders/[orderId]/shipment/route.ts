import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

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
        merchantId: user.merchant.id,
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
          oldValue: null,
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

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    console.error("Merchant order shipment error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update shipment" },
      { status: 500 }
    )
  }
}

