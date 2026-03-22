"use client"

import type { Ticket, TicketMessage } from "@prisma/client"

type TicketWithMessages = Ticket & { messages: TicketMessage[] }

export function TicketDetail({ initialTicket }: { initialTicket: TicketWithMessages }) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{initialTicket.subject}</h1>
        <p className="text-sm text-muted-foreground">Status: {initialTicket.status}</p>
      </div>
      <div className="rounded-md border divide-y">
        {initialTicket.messages.map((m) => (
          <div key={m.id} className="p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">{m.senderType}</p>
            <p className="whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
