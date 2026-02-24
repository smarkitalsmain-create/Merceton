"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClientDate } from "@/components/ClientDate"

interface MerchantAuditTabProps {
  merchantId: string
}

export function MerchantAuditTab({ merchantId }: MerchantAuditTabProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/audit-logs?entityType=MerchantFeeConfig&entityId=${merchantId}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [merchantId])

  if (loading) {
    return <div className="text-center py-8">Loading audit logs...</div>
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
          {logs.map((log) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
