import { requireMerchant } from "@/lib/auth"
import { getMerchantTickets } from "@/app/actions/tickets"
import { TicketsList } from "@/components/support/TicketsList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function SupportPage() {
  const merchant = await requireMerchant()
  // Support tickets = Starter baseline (no gating)
  const tickets = await getMerchantTickets()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Get help from our support team</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/support/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Link>
        </Button>
      </div>

      <TicketsList initialTickets={tickets} />
    </div>
  )
}
