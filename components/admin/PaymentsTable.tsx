"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

interface Payment {
  id: string
  merchantId: string
  orderId: string
  paymentMethod: string
  status: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  amount: number
  createdAt: Date
  merchant: {
    displayName: string
    slug: string
  }
  order: {
    orderNumber: string
  }
}

interface PaymentsTableProps {
  payments: Payment[]
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Razorpay IDs</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                <code className="text-xs bg-muted px-2 py-1 rounded">{payment.order.orderNumber}</code>
              </TableCell>
              <TableCell>
                <Link href={`/s/${payment.merchant.slug}`} className="text-sm hover:underline">
                  {payment.merchant.displayName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{payment.paymentMethod}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    payment.status === "PAID"
                      ? "default"
                      : payment.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">₹{formatMoney(payment.amount)}</TableCell>
              <TableCell className="text-xs">
                {payment.razorpayOrderId && (
                  <div>
                    <div>Order: {payment.razorpayOrderId.slice(0, 12)}...</div>
                    {payment.razorpayPaymentId && (
                      <div>Payment: {payment.razorpayPaymentId.slice(0, 12)}...</div>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <ClientDate value={payment.createdAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
