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
        merchantId: dbUser.merchant.id,
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
        // Omit oldValue and newValue for NOTE type events (optional Json? fields)
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

