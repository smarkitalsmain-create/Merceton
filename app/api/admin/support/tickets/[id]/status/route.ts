import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { updateTicket } from "@/app/actions/tickets"
import { TicketStatus } from "@prisma/client"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const ticketId = params.id
  if (!ticketId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Ticket id required" } },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const status = body.status as TicketStatus | undefined
    if (!status || !["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "status must be OPEN, PENDING, RESOLVED, or CLOSED" } },
        { status: 400 }
      )
    }

    const result = await updateTicket({ ticketId, status })
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update status"
    const status = msg === "Ticket not found" ? 404 : 500
    return NextResponse.json(
      { error: { code: status === 404 ? "NOT_FOUND" : "SERVER_ERROR", message: msg } },
      { status }
    )
  }
}
