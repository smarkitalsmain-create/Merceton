export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { listAllPlatformInvoices } from "@/lib/billing/queries"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClientDate } from "@/components/ClientDate"
import { formatMoney } from "@/lib/formatMoney"
import { FileText } from "lucide-react"
import { PlatformInvoicesClient } from "./PlatformInvoicesClient"

export default async function AdminPlatformInvoicesPage() {
  await requireSuperAdmin()

  const [invoices, merchants] = await Promise.all([
    listAllPlatformInvoices(100),
    prisma.merchant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        displayName: true,
        users: {
          select: {
            email: true,
          },
          take: 1,
        },
      },
      orderBy: {
        displayName: "asc",
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Invoices</h1>
        <p className="text-muted-foreground">
          Download invoices generated from ledger (on-demand) or view existing invoices
        </p>
      </div>

      {/* On-Demand Invoice Generation */}
      <PlatformInvoicesClient merchants={merchants} />

      <div className="border-t my-6" />

      {/* Existing Invoices List */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Existing Invoices</h2>
        <p className="text-muted-foreground mb-4">
          View all platform invoices issued to merchants
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No invoices found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Platform Invoices</CardTitle>
            <CardDescription>Invoices issued by Smarkitals Technologies India Pvt Ltd</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const total = invoice.total.toNumber()
                const statusColor =
                  invoice.status === "PAID"
                    ? "default"
                    : invoice.status === "CANCELLED"
                    ? "destructive"
                    : "secondary"

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                        <Badge variant={statusColor}>{invoice.status}</Badge>
                        <Link
                          href={`/admin/merchants/${invoice.merchant.id}`}
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {invoice.merchant.displayName}
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Period:{" "}
                        {new Date(invoice.cycle.periodStart).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(invoice.cycle.periodEnd).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <ClientDate value={invoice.invoiceDate} />
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-lg">₹{formatMoney(total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.lineItems.length} item(s)
                      </p>
                    </div>
                    <Link href={`/admin/platform-invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
