import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ClientDate } from "@/components/ClientDate"
import { LedgerExportBar } from "@/components/ledger/LedgerExportBar"

export const runtime = "nodejs"

const LEDGER_TYPES = [
  "GROSS_ORDER_VALUE",
  "PLATFORM_FEE",
  "ORDER_PAYOUT",
  "PAYOUT_PROCESSED",
] as const

type LedgerType = (typeof LEDGER_TYPES)[number] | "ALL"

export default async function LedgerPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const merchant = await requireMerchant()

  const from = typeof searchParams?.from === "string" ? searchParams.from : ""
  const to = typeof searchParams?.to === "string" ? searchParams.to : ""
  const type = (typeof searchParams?.type === "string" ? searchParams.type : "ALL") as LedgerType

  const where: any = {
    merchantId: merchant.id,
  }

  if (from || to) {
    where.createdAt = {}
    if (from) {
      where.createdAt.gte = new Date(from)
    }
    if (to) {
      // include end date full day
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  if (type && type !== "ALL") {
    where.type = type
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ledger</h1>
        <p className="text-muted-foreground">
          View all financial ledger entries for your store. Use filters to narrow down results or export as a
          spreadsheet.
        </p>
      </div>

      <LedgerExportBar />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by date range and entry type</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              name="from"
              defaultValue={from}
              onChange={() => {}}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              name="to"
              defaultValue={to}
              onChange={() => {}}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select defaultValue={type}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {LEDGER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>Most recent ledger entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <ClientDate value={entry.createdAt} />
                  </TableCell>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>
                    {entry.order?.orderNumber ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {entry.order.orderNumber}
                      </code>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={entry.description || undefined}>
                    {entry.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.amount.toNumber().toFixed(2)}
                  </TableCell>
                  <TableCell>{entry.status}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No ledger entries found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

