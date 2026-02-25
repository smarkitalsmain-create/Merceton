export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { getAdminTicket } from "@/app/actions/tickets"
import { AdminTicketDetail } from "@/components/support/AdminTicketDetail"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminSupportTicketPage({
  params,
}: {
  params: { id: string }
}) {
  await requireSuperAdmin()

  try {
    const ticket = await getAdminTicket(params.id)
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/admin/support">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
        </div>
        <AdminTicketDetail initialTicket={ticket} />
      </div>
    )
  } catch {
    notFound()
  }
}
