import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/formatMoney"
import { getEffectiveFeeConfig } from "@/lib/pricing"
import { ClientDate } from "@/components/ClientDate"

export default async function PayoutsPage() {
  const merchant = await requireMerchant()
  const effectiveConfig = await getEffectiveFeeConfig(merchant.id)

  // Get all orders for this merchant
  const ordersRaw = await prisma.order.findMany({
    where: { merchantId: merchant.id },
    select: {
      grossAmount: true,
      platformFee: true,
      netPayable: true,
      status: true,
      payment: {
        select: {
          status: true,
        },
      },
    },
  })

  // Convert Decimal fields to numbers at data boundary
  const orders = ordersRaw.map((order) => ({
    ...order,
    grossAmount: order.grossAmount.toNumber(),
    platformFee: order.platformFee.toNumber(),
    netPayable: order.netPayable.toNumber(),
  }))

  // Calculate totals
  const totals = orders.reduce(
    (acc, order) => {
      acc.totalGross += order.grossAmount
      acc.totalFees += order.platformFee
      acc.totalNet += order.netPayable
      return acc
    },
    { totalGross: 0, totalFees: 0, totalNet: 0 }
  )

  // Calculate by payment status
  const paidOrders = orders.filter((o) => o.payment?.status === "PAID")
  const paidTotals = paidOrders.reduce(
    (acc, order) => {
      acc.totalGross += order.grossAmount
      acc.totalFees += order.platformFee
      acc.totalNet += order.netPayable
      return acc
    },
    { totalGross: 0, totalFees: 0, totalNet: 0 }
  )

  // Get ledger entries for detailed view
  const ledgerEntriesRaw = await prisma.ledgerEntry.findMany({
    where: {
      merchantId: merchant.id,
      type: { in: ["GROSS_ORDER_VALUE", "PLATFORM_FEE", "ORDER_PAYOUT"] },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Convert Decimal fields to numbers at data boundary
  const ledgerEntries = ledgerEntriesRaw.map((entry) => ({
    ...entry,
    amount: entry.amount.toNumber(),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payouts & Fees</h1>
        <p className="text-muted-foreground">Track your earnings and platform fees</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Gross</CardTitle>
            <CardDescription>All orders (paid + pending)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatMoney(totals.totalGross)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fees</CardTitle>
            <CardDescription>Platform fees deducted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{formatMoney(totals.totalFees)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Receivable</CardTitle>
            <CardDescription>Total amount payable to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{formatMoney(totals.totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Paid Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Paid Orders Summary</CardTitle>
          <CardDescription>Orders with confirmed payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Gross (Paid)</p>
              <p className="text-xl font-bold">₹{formatMoney(paidTotals.totalGross)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fees (Paid)</p>
              <p className="text-xl font-bold text-red-600">₹{formatMoney(paidTotals.totalFees)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Receivable (Paid)</p>
              <p className="text-xl font-bold text-green-600">₹{formatMoney(paidTotals.totalNet)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>Detailed transaction log (source of truth)</CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No ledger entries yet</p>
          ) : (
            <div className="space-y-2">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.type.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">
                        Order {entry.order.orderNumber}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <ClientDate value={entry.createdAt} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        entry.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {entry.amount >= 0 ? "+" : ""}
                      ₹{formatMoney(entry.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Configuration</CardTitle>
          <CardDescription>Current platform fee settings (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fixed Fee:</span>
              <span className="font-medium">
                ₹{formatMoney(effectiveConfig.fixedFeePaise / 100)} per order
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Variable Fee:</span>
              <span className="font-medium">
                {effectiveConfig.variableFeeBps / 100}% per order
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pricing Package:</span>
              <span className="font-medium">
                {effectiveConfig.packageName || "Default"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fee configuration is managed by platform administrators. Contact support for changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
