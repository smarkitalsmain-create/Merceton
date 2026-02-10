import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface MerchantOrdersTabProps {
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    grossAmount: { toNumber(): number }
    platformFee: { toNumber(): number }
    netPayable: { toNumber(): number }
    createdAt: Date
    payment: {
      status: string
      amount: { toNumber(): number }
    } | null
  }>
}

export function MerchantOrdersTab({ orders }: MerchantOrdersTabProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gross Amount</TableHead>
            <TableHead>Platform Fee</TableHead>
            <TableHead>Net Payable</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <Badge variant="outline">{order.status}</Badge>
              </TableCell>
              <TableCell>₹{order.grossAmount.toNumber().toFixed(2)}</TableCell>
              <TableCell>₹{order.platformFee.toNumber().toFixed(2)}</TableCell>
              <TableCell>₹{order.netPayable.toNumber().toFixed(2)}</TableCell>
              <TableCell>
                {order.payment ? (
                  <Badge variant="outline">{order.payment.status}</Badge>
                ) : (
                  <span className="text-muted-foreground">No payment</span>
                )}
              </TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
