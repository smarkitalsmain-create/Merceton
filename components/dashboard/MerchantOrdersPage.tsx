"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"

type OrderStage =
  | "NEW"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

type SettlementStatus = "NOT_ELIGIBLE" | "ELIGIBLE" | "ON_HOLD" | "SETTLED"

interface OrderSummary {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: any | null
  stage: OrderStage
  paymentStatus: PaymentStatus
  settlementStatus: SettlementStatus
  totalAmount: string | number
  createdAt: string
}

const ORDER_STAGE_LABELS: OrderStage[] = [
  "NEW",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]

const PAYMENT_STATUS_LABELS: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]

const ALLOWED_TRANSITIONS: Record<OrderStage, OrderStage[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
}

import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

function formatCurrency(amount: string | number) {
  return `₹${formatMoney(amount)}`
}

function getCity(shippingAddress: any): string | null {
  if (!shippingAddress) return null
  if (typeof shippingAddress === "string") return shippingAddress
  return shippingAddress.city || shippingAddress.town || shippingAddress.state || null
}

export function MerchantOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, startTransition] = useTransition()
  const [stageFilter, setStageFilter] = useState<string>("")
  const [paymentFilter, setPaymentFilter] = useState<string>("")
  const [q, setQ] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const { toast } = useToast()

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Hydrate filters from URL if present
    const sStage = searchParams.get("stage") || ""
    const sPayment = searchParams.get("paymentStatus") || ""
    const sQ = searchParams.get("q") || ""
    const sFrom = searchParams.get("dateFrom") || ""
    const sTo = searchParams.get("dateTo") || ""
    setStageFilter(sStage)
    setPaymentFilter(sPayment)
    setQ(sQ)
    setDateFrom(sFrom)
    setDateTo(sTo)
  }, [searchParams])

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (stageFilter) params.set("stage", stageFilter)
      if (paymentFilter) params.set("paymentStatus", paymentFilter)
      if (q) params.set("q", q)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/merchant/orders?${params.toString()}`, {
        method: "GET",
      })
      const text = await res.text()
      if (!res.ok) {
        throw new Error(
          `Failed to load orders (${res.status}): ${text || res.statusText}`
        )
      }
      const data = JSON.parse(text) as { orders: OrderSummary[] }
      setOrders(data.orders || [])
    } catch (error) {
      console.error("Merchant orders fetch error:", error)
      toast({
        title: "Failed to load orders",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [stageFilter, paymentFilter, q, dateFrom, dateTo, toast])

  useEffect(() => {
    // Fetch on mount and whenever filters change
    fetchOrders()
  }, [fetchOrders])

  const applyFiltersToUrl = () => {
    const params = new URLSearchParams()
    if (stageFilter) params.set("stage", stageFilter)
    if (paymentFilter) params.set("paymentStatus", paymentFilter)
    if (q) params.set("q", q)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    const search = params.toString()
    router.replace(search ? `?${search}` : "")
  }

  const handleStageChange = (order: OrderSummary, nextStage: OrderStage) => {
    startTransition(async () => {
      try {
        let body: any = { stage: nextStage }

        if (nextStage === "CANCELLED") {
          const reason = window.prompt("Enter cancellation reason:")
          if (!reason || reason.trim().length === 0) {
            toast({
              title: "Cancellation aborted",
              description: "Reason is required to cancel an order.",
              variant: "destructive",
            })
            return
          }
          body.reason = reason
        }

        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(order.id)}/stage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to update stage (${res.status}): ${text || res.statusText}`
          )
        }
        const data = JSON.parse(text) as { order: OrderSummary }
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, ...data.order } : o))
        )
        toast({
          title: "Order updated",
          description: `Stage changed to ${nextStage}`,
        })
      } catch (error) {
        console.error("Stage change error:", error)
        toast({
          title: "Failed to update stage",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  const handleCancelOrder = (order: OrderSummary) => {
    startTransition(async () => {
      try {
        const reason = window.prompt("Enter cancellation reason:")
        if (!reason || reason.trim().length === 0) {
          toast({
            title: "Cancellation aborted",
            description: "Reason is required to cancel an order.",
            variant: "destructive",
          })
          return
        }

        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(order.id)}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to cancel order (${res.status}): ${text || res.statusText}`
          )
        }
        const data = JSON.parse(text) as { order: OrderSummary }
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, ...data.order } : o))
        )
        toast({
          title: "Order cancelled",
          description: `Order ${order.orderNumber} has been cancelled.`,
        })
      } catch (error) {
        console.error("Order cancel error:", error)
        toast({
          title: "Failed to cancel order",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-full md:w-64">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Search
              </label>
              <Input
                placeholder="Order #, customer, phone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Stage
              </label>
              <Select
                value={stageFilter}
                onValueChange={(value) => setStageFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STAGE_LABELS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-52">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Payment status
              </label>
              <Select
                value={paymentFilter}
                onValueChange={(value) => setPaymentFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_LABELS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setStageFilter("")
                  setPaymentFilter("")
                  setQ("")
                  setDateFrom("")
                  setDateTo("")
                  applyFiltersToUrl()
                }}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={applyFiltersToUrl}
                disabled={isLoading}
              >
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-2 py-2 text-left">Order</th>
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-left">Customer</th>
                    <th className="px-2 py-2 text-left">City</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-left">Payment</th>
                    <th className="px-2 py-2 text-left">Stage</th>
                    <th className="px-2 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const allowedTargets = ALLOWED_TRANSITIONS[order.stage] || []
                    const city = getCity(order.shippingAddress)
                    return (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              #{order.orderNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ID: {order.id.slice(0, 8)}…
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <ClientDate value={order.createdAt} />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col">
                            <span>{order.customerName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {order.customerPhone || order.customerEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-xs text-muted-foreground">
                            {city || "-"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            variant={
                              order.paymentStatus === "PAID" ? "default" : "outline"
                            }
                          >
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={order.stage}
                            onValueChange={(value) =>
                              handleStageChange(order, value as OrderStage)
                            }
                            disabled={isMutating || allowedTargets.length === 0}
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={order.stage}>
                                {order.stage}
                              </SelectItem>
                              {allowedTargets.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                View
                              </Button>
                            </Link>
                            <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                Invoice
                              </Button>
                            </Link>
                            {order.stage !== "CANCELLED" &&
                              order.stage !== "DELIVERED" &&
                              order.stage !== "RETURNED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleCancelOrder(order)}
                                  disabled={isMutating}
                                >
                                  Cancel
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

