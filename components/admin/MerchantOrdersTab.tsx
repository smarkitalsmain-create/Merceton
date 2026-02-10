import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

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
              <TableCell>₹{formatMoney(order.grossAmount.toNumber())}</TableCell>
              <TableCell>₹{formatMoney(order.platformFee.toNumber())}</TableCell>
              <TableCell>₹{formatMoney(order.netPayable.toNumber())}</TableCell>
              <TableCell>
                {order.payment ? (
                  <Badge variant="outline">{order.payment.status}</Badge>
                ) : (
                  <span className="text-muted-foreground">No payment</span>
                )}
              </TableCell>
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
