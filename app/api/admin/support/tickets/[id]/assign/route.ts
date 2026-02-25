import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { updateTicket } from "@/app/actions/tickets"

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
    const assignedToUserId = body.assignedToUserId !== undefined
      ? (body.assignedToUserId === null || body.assignedToUserId === "" ? null : String(body.assignedToUserId))
      : undefined

    const result = await updateTicket({ ticketId, assignedToUserId })
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to assign"
    const status = msg === "Ticket not found" ? 404 : 500
    return NextResponse.json(
      { error: { code: status === 404 ? "NOT_FOUND" : "SERVER_ERROR", message: msg } },
      { status }
    )
  }
}
