export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { ClientDate } from "@/components/ClientDate"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: { 
    actor?: string
    entityType?: string
    entityId?: string
    actionType?: string
    page?: string
  }
}) {
  await requireSuperAdmin()

  const page = parseInt(searchParams?.page || "1")
  const limit = 50
  const skip = (page - 1) * limit

  const where: any = {}
  if (searchParams?.actor) {
    where.actorUserId = { contains: searchParams.actor, mode: "insensitive" }
  }
  if (searchParams?.entityType) {
    where.entityType = searchParams.entityType
  }
  if (searchParams?.entityId) {
    where.entityId = searchParams.entityId
  }
  if (searchParams?.actionType) {
    where.actionType = searchParams.actionType
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.adminAuditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Complete audit trail of all admin actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by actor, entity, or action type</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                name="actor"
                placeholder="Actor User ID"
                defaultValue={searchParams?.actor}
              />
            </div>
            <div>
              <Input
                name="entityType"
                placeholder="Entity Type"
                defaultValue={searchParams?.entityType}
              />
            </div>
            <div>
              <Input
                name="entityId"
                placeholder="Entity ID"
                defaultValue={searchParams?.entityId}
              />
            </div>
            <div>
              <Input
                name="actionType"
                placeholder="Action Type"
                defaultValue={searchParams?.actionType}
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <ClientDate value={log.createdAt} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.actorEmail || log.actorUserId}</div>
                          <div className="text-xs text-muted-foreground">{log.actorUserId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.entityType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.entityId || "-"}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm">
                        {log.reason}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" asChild>
                    <a href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}>
                      Previous
                    </a>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" asChild>
                    <a href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}>
                      Next
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
