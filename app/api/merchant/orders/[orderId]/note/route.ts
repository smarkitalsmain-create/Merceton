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
    const message: string | undefined = body.message

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Note message is required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        merchantId: user.merchant.id,
      },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const event = await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "NOTE",
        message,
        oldValue: null,
        newValue: null,
        createdBy: "MERCHANT",
      },
    })

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error("Merchant order note error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to add note" },
      { status: 500 }
    )
  }
}

