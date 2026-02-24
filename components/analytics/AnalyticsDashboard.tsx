"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/currency"
import Image from "next/image"

interface SalesByProduct {
  productId: string
  productName: string
  sku: string | null
  imageUrl: string | null
  totalRevenue: number
  totalQuantity: number
  orderCount: number
  averageOrderValue: number
}

interface SalesByDate {
  date: string
  revenue: number
  orders: number
  quantity: number
  discount: number
}

interface TopCustomer {
  email: string
  name: string
  phone: string | null
  totalRevenue: number
  orderCount: number
  averageOrderValue: number
  firstOrderDate: string
  lastOrderDate: string
}

interface ConversionStats {
  totalOrders: number
  paidOrders: number
  conversionRate: number
  totalRevenue: number
  averageOrderValue: number
  statusBreakdown: Record<string, number>
  note: string
}

export function AnalyticsDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30) // Default to last 30 days
    return date.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")

  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([])
  const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [conversion, setConversion] = useState<ConversionStats | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
      })

      const [productsRes, dateRes, customersRes, conversionRes] = await Promise.all([
        fetch(`/api/analytics/sales-by-product?${params}`),
        fetch(`/api/analytics/sales-by-date?${params}&groupBy=${groupBy}`),
        fetch(`/api/analytics/top-customers?${params}`),
        fetch(`/api/analytics/conversion?${params}`),
      ])

      if (!productsRes.ok || !dateRes.ok || !customersRes.ok || !conversionRes.ok) {
        throw new Error("Failed to load analytics data")
      }

      const [productsData, dateData, customersData, conversionData] = await Promise.all([
        productsRes.json(),
        dateRes.json(),
        customersRes.json(),
        conversionRes.json(),
      ])

      setSalesByProduct(productsData.products || [])
      setSalesByDate(dateData.sales || [])
      setTopCustomers(customersData.customers || [])
      setConversion(conversionData)
    } catch (error: any) {
      console.error("Analytics load error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, groupBy, toast])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const handleRefresh = () => {
    loadAnalytics()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select the time period for analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger id="groupBy" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Stats */}
      {conversion && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversion.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Checkout started</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversion.paidOrders}</div>
              <p className="text-xs text-muted-foreground">
                {conversion.conversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(conversion.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(conversion.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topCustomers.length}</div>
              <p className="text-xs text-muted-foreground">In this period</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales by Product */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Product</CardTitle>
          <CardDescription>Top selling products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {salesByProduct.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales data for this period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByProduct.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <div className="relative h-10 w-10">
                            <Image
                              src={product.imageUrl}
                              alt={product.productName}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <span className="font-medium">{product.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || "—"}</TableCell>
                    <TableCell className="text-right">{product.totalQuantity}</TableCell>
                    <TableCell className="text-right">{product.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(product.averageOrderValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sales by Date */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Date</CardTitle>
          <CardDescription>Revenue and orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          {salesByDate.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales data for this period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByDate.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {new Date(day.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">{day.orders}</TableCell>
                    <TableCell className="text-right">{day.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(day.discount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(day.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Customers by total revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customer data for this period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, idx) => (
                  <TableRow key={customer.email}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{customer.email}</TableCell>
                    <TableCell className="text-right">{customer.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(customer.averageOrderValue)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
