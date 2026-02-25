import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const id = params.id
  if (!id) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Ticket id required" } },
      { status: 400 }
    )
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { id: true, displayName: true, slug: true },
        },
        messages: { orderBy: { createdAt: "asc" } },
        internalNotes: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ticket not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json(ticket)
  } catch (e) {
    console.error("[admin/support/tickets/[id]] GET error:", e)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: e instanceof Error ? e.message : "Failed to load ticket" } },
      { status: 500 }
    )
  }
}
