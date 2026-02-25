"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TicketStatus, TicketPriority } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AdminTicket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: Date
  updatedAt: Date
  merchant: { id: string; displayName: string; slug: string }
  _count: { messages: number }
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

interface AdminTicketsListProps {
  initialTickets: AdminTicket[]
}

export function AdminTicketsList({ initialTickets }: AdminTicketsListProps) {
  if (initialTickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground">No support tickets yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tickets created by merchants will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="hover:underline"
                  >
                    {ticket.subject}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/merchants/${ticket.merchant.id}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {ticket.merchant.displayName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>{ticket._count.messages}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/support/${ticket.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
