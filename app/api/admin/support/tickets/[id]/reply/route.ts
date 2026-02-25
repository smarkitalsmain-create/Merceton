import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { replyToTicket } from "@/app/actions/tickets"

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
    const message = typeof body.message === "string" ? body.message.trim() : ""
    if (!message) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "message is required" } },
        { status: 400 }
      )
    }

    const result = await replyToTicket({ ticketId, message })
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to reply"
    const status = msg === "Ticket not found" ? 404 : msg === "Unauthorized" || msg === "FORBIDDEN" ? 403 : 500
    return NextResponse.json(
      { error: { code: status === 404 ? "NOT_FOUND" : "SERVER_ERROR", message: msg } },
      { status }
    )
  }
}
