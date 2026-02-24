"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClientDate } from "@/components/ClientDate"
import { FileText } from "lucide-react"

interface AuditLog {
  id: string
  actorUserId: string
  actorEmail: string | null
  action: string
  entityType: string
  entityId: string | null
  reason: string | null
  createdAt: Date
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    actorUserId: "",
    entityType: "",
    action: "",
    startDate: "",
    endDate: "",
  })

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.actorUserId) params.set("actorUserId", filters.actorUserId)
      if (filters.entityType) params.set("entityType", filters.entityType)
      if (filters.action) params.set("action", filters.action)
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)
      params.set("limit", "100")

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (!res.ok) throw new Error("Failed to load logs")
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (error) {
      console.error("Error loading logs:", error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function handleFilterChange(key: string, value: string) {
    setFilters({ ...filters, [key]: value })
  }

  function handleApplyFilters() {
    loadLogs()
  }

  function handleResetFilters() {
    setFilters({
      actorUserId: "",
      entityType: "",
      action: "",
      startDate: "",
      endDate: "",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">View system audit trail and admin actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="actorUserId">Actor User ID</Label>
              <Input
                id="actorUserId"
                value={filters.actorUserId}
                onChange={(e) => handleFilterChange("actorUserId", e.target.value)}
                placeholder="user_xxx"
              />
            </div>
            <div>
              <Label htmlFor="entityType">Entity Type</Label>
              <Input
                id="entityType"
                value={filters.entityType}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
                placeholder="PlatformBillingProfile"
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                placeholder="billing_profile.update"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {total} total log{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <ClientDate value={log.createdAt} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.actorEmail || log.actorUserId}</div>
                          <div className="text-xs text-muted-foreground">{log.actorUserId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{log.action}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.entityType}</div>
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground">{log.entityId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
