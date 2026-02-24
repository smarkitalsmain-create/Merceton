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
    const reason: string | undefined = body.reason

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        merchantId: dbUser.merchant.id,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.stage)) {
      return NextResponse.json(
        { error: "Cannot cancel an order after it has been shipped" },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          stage: "CANCELLED",
          status: "CANCELLED",
        },
      })

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "STAGE_CHANGE",
          message: `Order cancelled: ${reason}`,
          oldValue: { stage: order.stage },
          newValue: { stage: "CANCELLED" },
          createdBy: "MERCHANT",
        },
      })

      return updatedOrder
    })

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    console.error("Merchant order cancel error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to cancel order" },
      { status: 500 }
    )
  }
}

