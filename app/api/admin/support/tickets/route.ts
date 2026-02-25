import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { TicketStatus, TicketPriority } from "@prisma/client"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") as TicketStatus | null
  const priority = searchParams.get("priority") as TicketPriority | null
  const merchantId = searchParams.get("merchantId")

  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(merchantId && { merchantId }),
      },
      include: {
        merchant: {
          select: { id: true, displayName: true, slug: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(tickets)
  } catch (e) {
    console.error("[admin/support/tickets] GET error:", e)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: e instanceof Error ? e.message : "Failed to list tickets" } },
      { status: 500 }
    )
  }
}
