export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { getAdminTickets } from "@/app/actions/tickets"
import { AdminTicketsList } from "@/components/support/AdminTicketsList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Headphones } from "lucide-react"

export default async function AdminSupportPage() {
  await requireSuperAdmin()

  const tickets = await getAdminTickets()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">
          View and respond to merchant support tickets
        </p>
      </div>

      <AdminTicketsList initialTickets={tickets} />
    </div>
  )
}
