import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
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

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        merchantId: dbUser.merchant.id,
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

