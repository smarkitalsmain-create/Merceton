"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"
import { replyToTicket } from "@/app/actions/tickets"
import { TicketStatus, TicketPriority, TicketSenderType } from "@prisma/client"

interface TicketMessage {
  id: string
  senderType: TicketSenderType
  message: string
  createdAt: Date
}

interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: Date
  updatedAt: Date
  messages: TicketMessage[]
}

interface TicketDetailProps {
  initialTicket: Ticket
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

export function TicketDetail({ initialTicket }: TicketDetailProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [ticket, setTicket] = useState(initialTicket)
  const [replyMessage, setReplyMessage] = useState("")

  const canReply = ticket.status !== TicketStatus.CLOSED

  const handleReply = () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await replyToTicket({
          ticketId: ticket.id,
          message: replyMessage,
        })

        if (result.success) {
          // Refresh ticket data
          const response = await fetch(`/api/tickets/${ticket.id}`)
          if (response.ok) {
            const updatedTicket = await response.json()
            setTicket(updatedTicket)
          }
          setReplyMessage("")
          toast({
            title: "Reply sent",
            description: "Your reply has been sent successfully.",
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reply",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{ticket.subject}</h1>
          <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
          <Badge variant="outline" className={priorityColors[ticket.priority]}>
            {ticket.priority}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Created {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Messages Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>All messages for this ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.senderType === TicketSenderType.MERCHANT
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {message.senderType === TicketSenderType.MERCHANT ? "You" : "Support Team"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {canReply && (
        <Card>
          <CardHeader>
            <CardTitle>Reply</CardTitle>
            <CardDescription>Add a message to this ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Your Message</Label>
              <Textarea
                id="reply"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
                maxLength={5000}
              />
            </div>
            <Button onClick={handleReply} disabled={isPending || !replyMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isPending ? "Sending..." : "Send Reply"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!canReply && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">This ticket is closed and cannot be replied to.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
