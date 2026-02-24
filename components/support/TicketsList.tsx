"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TicketStatus, TicketPriority } from "@prisma/client"

interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: Date
  updatedAt: Date
  _count: {
    messages: number
  }
}

interface TicketsListProps {
  initialTickets: Ticket[]
}

const statusColors: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
}

const priorityColors: Record<TicketPriority, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-orange-100 text-orange-800",
  HIGH: "bg-red-100 text-red-800",
}

export function TicketsList({ initialTickets }: TicketsListProps) {
  if (initialTickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground mb-4">No tickets yet</p>
          <Button asChild>
            <Link href="/dashboard/support/new">Create Your First Ticket</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {initialTickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="font-semibold text-lg hover:underline"
                  >
                    {ticket.subject}
                  </Link>
                  <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                  <Badge variant="outline" className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{ticket._count.messages} message{ticket._count.messages !== 1 ? "s" : ""}</span>
                  <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
                  {ticket.updatedAt > ticket.createdAt && (
                    <span>Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/support/${ticket.id}`}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
