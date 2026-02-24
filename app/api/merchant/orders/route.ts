import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get("stage")
    const paymentStatus = searchParams.get("paymentStatus")
    const q = searchParams.get("q")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: any = {
      merchantId: dbUser.merchant.id,
    }

    if (stage) {
      where.stage = stage
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error("Merchant orders list error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to load orders" },
      { status: 500 }
    )
  }
}

