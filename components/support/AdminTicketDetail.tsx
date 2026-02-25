"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { replyToTicket, updateTicket, addInternalNote } from "@/app/actions/tickets"
import { TicketStatus, TicketPriority, TicketSenderType } from "@prisma/client"
import { Loader2, Send, MessageSquare, StickyNote } from "lucide-react"
import Link from "next/link"

interface TicketMessage {
  id: string
  senderType: TicketSenderType
  message: string
  createdAt: Date
}

interface InternalNote {
  id: string
  note: string
  createdAt: Date
}

interface AdminTicketDetailProps {
  initialTicket: {
    id: string
    subject: string
    status: TicketStatus
    priority: TicketPriority
    createdAt: Date
    updatedAt: Date
    merchant: { id: string; displayName: string; slug: string }
    messages: TicketMessage[]
    internalNotes: InternalNote[]
  }
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

export function AdminTicketDetail({ initialTicket }: AdminTicketDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [ticket, setTicket] = useState(initialTicket)
  const [replyMessage, setReplyMessage] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority)

  useEffect(() => {
    setTicket(initialTicket)
    setStatus(initialTicket.status)
    setPriority(initialTicket.priority)
  }, [initialTicket])

  const canReply = ticket.status !== TicketStatus.CLOSED

  const handleReply = () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }
    startTransition(async () => {
      try {
        const result = await replyToTicket({ ticketId: ticket.id, message: replyMessage })
        if (result.success) {
          setReplyMessage("")
          toast({ title: "Reply sent", description: "Your reply has been sent." })
          router.refresh()
        }
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send reply",
          variant: "destructive",
        })
      }
    })
  }

  const handleUpdateStatus = (newStatus: TicketStatus) => {
    setStatus(newStatus)
    startTransition(async () => {
      try {
        await updateTicket({ ticketId: ticket.id, status: newStatus })
        setTicket((prev) => ({ ...prev, status: newStatus }))
        toast({ title: "Status updated", description: `Status set to ${newStatus}.` })
        router.refresh()
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update status",
          variant: "destructive",
        })
      }
    })
  }

  const handleUpdatePriority = (newPriority: TicketPriority) => {
    setPriority(newPriority)
    startTransition(async () => {
      try {
        await updateTicket({ ticketId: ticket.id, priority: newPriority })
        setTicket((prev) => ({ ...prev, priority: newPriority }))
        toast({ title: "Priority updated", description: `Priority set to ${newPriority}.` })
        router.refresh()
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update priority",
          variant: "destructive",
        })
      }
    })
  }

  const handleAddInternalNote = () => {
    if (!internalNote.trim()) {
      toast({
        title: "Note required",
        description: "Please enter an internal note",
        variant: "destructive",
      })
      return
    }
    startTransition(async () => {
      try {
        await addInternalNote({ ticketId: ticket.id, note: internalNote })
        setInternalNote("")
        toast({ title: "Note added", description: "Internal note saved." })
        router.refresh()
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add note",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{ticket.subject}</h1>
          <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
          <Badge variant="outline" className={priorityColors[ticket.priority]}>
            {ticket.priority}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Merchant:{" "}
          <Link
            href={`/admin/merchants/${ticket.merchant.id}`}
            className="hover:underline font-medium"
          >
            {ticket.merchant.displayName}
          </Link>
          {" · "}
          Created {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>Change ticket status</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={ticket.status}
              onValueChange={(v) => handleUpdateStatus(v as TicketStatus)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority</CardTitle>
            <CardDescription>Set priority</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={ticket.priority}
              onValueChange={(v) => handleUpdatePriority(v as TicketPriority)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
          <CardDescription>Messages from merchant and support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg ${
                msg.senderType === TicketSenderType.MERCHANT
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {msg.senderType === TicketSenderType.MERCHANT
                    ? "Merchant"
                    : "Support"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {canReply && (
        <Card>
          <CardHeader>
            <CardTitle>Reply to merchant</CardTitle>
            <CardDescription>Your reply will be sent by email to the merchant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-reply">Message</Label>
              <Textarea
                id="admin-reply"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                maxLength={5000}
              />
            </div>
            <Button onClick={handleReply} disabled={isPending || !replyMessage.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Reply
            </Button>
          </CardContent>
        </Card>
      )}

      {!canReply && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            This ticket is closed. No further replies can be sent.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Internal notes
          </CardTitle>
          <CardDescription>Visible only to admins; not sent to merchant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.internalNotes.length > 0 && (
            <div className="space-y-2">
              {ticket.internalNotes.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"
                >
                  <p className="text-muted-foreground text-xs">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="internal-note">Add note</Label>
            <Textarea
              id="internal-note"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Internal note (not visible to merchant)..."
              rows={3}
              maxLength={2000}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddInternalNote}
              disabled={isPending || !internalNote.trim()}
            >
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
