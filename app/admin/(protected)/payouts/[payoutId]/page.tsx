export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClientDate } from "@/components/ClientDate"
import { formatMoney } from "@/lib/formatMoney"
import { FileText } from "lucide-react"

export default async function PayoutDetailPage({
  params,
}: {
  params: { payoutId: string }
}) {
  await requireSuperAdmin()

  const payout = await prisma.payoutBatch.findUnique({
    where: { id: params.payoutId },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      ledgerEntries: {
        include: {
          order: {
            select: {
              orderNumber: true,
              grossAmount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      platformInvoice: {
        include: {
          cycle: true,
          lineItems: true,
        },
      },
    },
  })

  if (!payout) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/payouts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payouts
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Payout Batch</h1>
        <p className="text-muted-foreground">Payout details and ledger entries</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={
                  payout.status === "COMPLETED"
                    ? "default"
                    : payout.status === "PENDING"
                    ? "secondary"
                    : "destructive"
                }
              >
                {payout.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Merchant</span>
              <Link
                href={`/admin/merchants/${payout.merchant.id}`}
                className="text-sm font-medium hover:underline"
              >
                {payout.merchant.displayName}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-medium">₹{payout.totalAmount.toNumber().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                <ClientDate value={payout.createdAt} />
              </span>
            </div>
            {payout.processedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processed</span>
                <span className="text-sm">
                  <ClientDate value={payout.processedAt} />
                </span>
              </div>
            )}
            {payout.razorpayPayoutId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Razorpay ID</span>
                <span className="text-sm font-mono">{payout.razorpayPayoutId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ledger Entries</span>
              <span className="font-medium">{payout.ledgerEntries.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ledger Entries</CardTitle>
            <CardDescription>Orders included in this payout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payout.ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No ledger entries
                      </TableCell>
                    </TableRow>
                  ) : (
                    payout.ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.order ? (
                            <Link
                              href={`/admin/orders/${entry.orderId}`}
                              className="font-medium hover:underline"
                            >
                              {entry.order.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.type}</Badge>
                        </TableCell>
                        <TableCell>₹{entry.amount.toNumber().toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === "COMPLETED"
                                ? "default"
                                : entry.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <ClientDate value={entry.createdAt} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Platform Invoice Section */}
        {payout.cycleId && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Platform Invoice</CardTitle>
              <CardDescription>
                Invoice issued by Smarkitals Technologies India Pvt Ltd for this payout cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payout.platformInvoice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{payout.platformInvoice.invoiceNumber}</h3>
                        <Badge
                          variant={
                            payout.platformInvoice.status === "PAID"
                              ? "default"
                              : payout.platformInvoice.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {payout.platformInvoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Period:{" "}
                        {new Date(payout.platformInvoice.cycle.periodStart).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(payout.platformInvoice.cycle.periodEnd).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <ClientDate value={payout.platformInvoice.invoiceDate} />
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-lg">
                        ₹{formatMoney(payout.platformInvoice.total.toNumber())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.platformInvoice.lineItems.length} item(s)
                      </p>
                    </div>
                    <Link href={`/admin/platform-invoices/${payout.platformInvoice.id}`}>
                      <Button variant="outline" size="sm">
                        View Invoice
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Invoice will be generated on Thursday</p>
                  <p className="text-sm mt-1">
                    Platform invoices are created weekly before payouts are executed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
