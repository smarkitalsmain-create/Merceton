import { requireMerchant } from "@/lib/auth"
import { listMerchantPlatformInvoices } from "@/lib/billing/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClientDate } from "@/components/ClientDate"
import { formatMoney } from "@/lib/formatMoney"
import { FileText } from "lucide-react"

export default async function MerchantInvoicesPage() {
  const merchant = await requireMerchant()

  const invoices = await listMerchantPlatformInvoices(merchant.id, 50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Invoices</h1>
        <p className="text-muted-foreground">
          View invoices issued by Smarkitals Technologies India Pvt Ltd
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Invoices are generated weekly on Thursdays for platform fees.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Platform settlement invoices</CardDescription>
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
                    <Link href={`/dashboard/payouts/invoices/${invoice.id}`}>
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
