import { requireMerchant } from "@/lib/auth"
import { CreateTicketForm } from "@/components/support/CreateTicketForm"

export default async function NewTicketPage() {
  await requireMerchant()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Support Ticket</h1>
        <p className="text-muted-foreground">Describe your issue and we&apos;ll help you resolve it</p>
      </div>

      <CreateTicketForm />
    </div>
  )
}
