"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Headphones, MessageSquare, AlertCircle, Clock, CheckCircle } from "lucide-react"

type RangeKey = "7d" | "30d" | "90d" | "this_month" | "last_month"

interface TicketsOverviewData {
  range: { from: string; to: string }
  createdCount: number
  openCount: number
  unassignedCount: number
  staleCount: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  topMerchants: Array<{
    merchantId: string
    merchantName: string | null
    count: number
  }>
  avgFirstResponseHours?: number
  avgResolutionHours?: number
}

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
]

export function SupportOverview() {
  const [range, setRange] = useState<RangeKey>("30d")
  const [data, setData] = useState<TicketsOverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/tickets/overview?range=${range}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) {
          return r.json().then((j) => {
            throw new Error(j?.error ?? `Request failed (${r.status})`)
          })
        }
        return r.json()
      })
      .then((json) => {
        setData(json)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load")
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [range])

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Support overview
          </CardTitle>
          <CardDescription>
            Ticket metrics for the selected period.{" "}
            <Link href="/admin/support" className="text-primary underline">
              View all tickets
            </Link>
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {loading && !data && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Created (period)</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.createdCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.openCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.unassignedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stale (&gt;48h)</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.staleCount}</p>
                </CardContent>
              </Card>
              {data.avgFirstResponseHours != null && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg response (h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{data.avgFirstResponseHours.toFixed(1)}</p>
                  </CardContent>
                </Card>
              )}
              {data.avgResolutionHours != null && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg resolution (h)</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{data.avgResolutionHours.toFixed(1)}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">By status</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.byStatus).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(data.byStatus).map(([status, count]) => (
                        <TableRow key={status}>
                          <TableCell>{status}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">By priority</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.byPriority).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(data.byPriority).map(([priority, count]) => (
                        <TableRow key={priority}>
                          <TableCell>{priority}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Top merchants (by ticket count)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topMerchants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topMerchants.map((row) => (
                      <TableRow key={row.merchantId}>
                        <TableCell>
                          <Link
                            href={`/admin/merchants/${row.merchantId}`}
                            className="text-primary underline"
                          >
                            {row.merchantName ?? row.merchantId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
