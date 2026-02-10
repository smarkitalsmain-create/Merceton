import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
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

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        merchantId: user.merchant.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        payment: true,
        shipments: true,
        refunds: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Merchant order detail error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to load order" },
      { status: 500 }
    )
  }
}

