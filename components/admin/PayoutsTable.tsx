"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Payout {
  id: string
  merchantId: string
  totalAmount: number
  status: string
  processedAt: Date | null
  createdAt: Date
  razorpayPayoutId: string | null
  merchant: {
    displayName: string
    slug: string
  }
  _count: {
    ledgerEntries: number
  }
}

interface PayoutsTableProps {
  payouts: Payout[]
}

export function PayoutsTable({ payouts }: PayoutsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ledger Entries</TableHead>
            <TableHead>Razorpay Payout ID</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell>
                <Link href={`/s/${payout.merchant.slug}`} className="text-sm hover:underline">
                  {payout.merchant.displayName}
                </Link>
              </TableCell>
              <TableCell className="font-medium">₹{payout.totalAmount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    payout.status === "COMPLETED"
                      ? "default"
                      : payout.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {payout.status}
                </Badge>
              </TableCell>
              <TableCell>{payout._count.ledgerEntries}</TableCell>
              <TableCell className="text-xs">
                {payout.razorpayPayoutId ? (
                  <code className="bg-muted px-2 py-1 rounded">
                    {payout.razorpayPayoutId.slice(0, 16)}...
                  </code>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : "-"}
              </TableCell>
              <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
