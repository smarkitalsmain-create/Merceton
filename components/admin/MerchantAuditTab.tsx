"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClientDate } from "@/components/ClientDate"

interface MerchantAuditTabProps {
  merchantId: string
}

interface AuditLog {
  id: string
  action: string
  actorEmail: string | null
  reason: string | null
  createdAt: string
}

export function MerchantAuditTab({ merchantId }: MerchantAuditTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/audit-logs?entityType=MerchantFeeConfig&entityId=${merchantId}&limit=100`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.error ?? "Failed to load audit logs")
        }
        const logsData = Array.isArray(json) ? json : json.logs ?? []
        setLogs(Array.isArray(logsData) ? (logsData as AuditLog[]) : [])
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load audit logs")
      })
      .finally(() => setLoading(false))
  }, [merchantId])

  if (loading) {
    return <div className="text-center py-8">Loading audit logs...</div>
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(logs) && logs.length > 0 ? (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell>{log.actorEmail || "Unknown"}</TableCell>
                <TableCell className="max-w-md truncate">{log.reason}</TableCell>
                <TableCell>
                  <ClientDate value={log.createdAt} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                No logs available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
