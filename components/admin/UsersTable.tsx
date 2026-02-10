"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { toggleUserStatus, reassignUserToMerchant } from "@/app/actions/admin"
import { CheckCircle2, XCircle, UserPlus } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  merchantId: string | null
  isActive: boolean
  createdAt: Date
  merchant: {
    id: string
    displayName: string
    slug: string
  } | null
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [reassigningId, setReassigningId] = useState<string | null>(null)

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    const reason = prompt(`Reason for ${currentStatus ? "disabling" : "enabling"} this user:`)
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await toggleUserStatus(userId, !currentStatus, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: `User ${result.user.isActive ? "enabled" : "disabled"}`,
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to update user status",
          variant: "destructive",
        })
      }
    })
  }

  const handleReassign = (userId: string, merchantId: string) => {
    const reason = prompt("Reason for reassigning user to merchant:")
    if (!reason) return

    setReassigningId(userId)
    startTransition(async () => {
      try {
        const result = await reassignUserToMerchant(userId, merchantId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "User reassigned to merchant",
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to reassign user",
          variant: "destructive",
        })
      }
      setReassigningId(null)
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.name || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                {user.merchant ? (
                  <span className="text-sm">{user.merchant.displayName}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">No merchant</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    disabled={isPending}
                  >
                    {user.isActive ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
