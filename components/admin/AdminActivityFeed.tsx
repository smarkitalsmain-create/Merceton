"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
})

function formatDateTime(value: Date): string {
  // Ensure we always format using the same locale/timezone on server and client
  return dateTimeFormatter.format(new Date(value))
}

interface AuditLog {
  id: string
  actorEmail: string | null
  actionType: string
  entityType: string
  createdAt: Date
}

interface AdminActivityFeedProps {
  logs: AuditLog[]
}

export function AdminActivityFeed({ logs }: AdminActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Admin Activity</CardTitle>
        <CardDescription>Latest audit log entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {log.actionType}
                  </Badge>
                  <span className="text-muted-foreground">{log.entityType}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.actorEmail || "Unknown"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/admin/audit-logs">
            <span className="text-sm text-primary hover:underline">View all audit logs →</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
