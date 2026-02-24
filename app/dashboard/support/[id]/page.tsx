import { requireMerchant } from "@/lib/auth"
import { getMerchantTicket } from "@/app/actions/tickets"
import { TicketDetail } from "@/components/support/TicketDetail"
import { notFound } from "next/navigation"

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireMerchant()

  try {
    const ticket = await getMerchantTicket(params.id)
    return <TicketDetail initialTicket={ticket} />
  } catch (error) {
    notFound()
  }
}
