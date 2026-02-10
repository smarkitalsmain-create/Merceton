"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

interface Order {
  id: string
  orderNumber: string
  merchantId: string
  status: string
  grossAmount: number
  platformFee: number
  netPayable: number
  createdAt: Date
  merchant: {
    displayName: string
    slug: string
  }
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gross Amount</TableHead>
            <TableHead>Platform Fee</TableHead>
            <TableHead>Net Payable</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                <code className="text-xs bg-muted px-2 py-1 rounded">{order.orderNumber}</code>
              </TableCell>
              <TableCell>
                <Link href={`/s/${order.merchant.slug}`} className="text-sm hover:underline">
                  {order.merchant.displayName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{order.status}</Badge>
              </TableCell>
              <TableCell>₹{formatMoney(order.grossAmount)}</TableCell>
              <TableCell>₹{formatMoney(order.platformFee)}</TableCell>
              <TableCell className="font-medium">₹{formatMoney(order.netPayable)}</TableCell>
              <TableCell>
                <ClientDate value={order.createdAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
