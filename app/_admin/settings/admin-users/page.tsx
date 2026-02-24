"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AdminUser {
  id: string
  userId: string
  email: string
  name: string | null
  isActive: boolean
  createdAt: Date
  roles: Array<{
    role: {
      id: string
      name: string
      description: string | null
    }
  }>
}

interface RoleOption {
  id: string
  name: string
  description: string | null
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    roleId: "",
    sendInviteEmail: true,
  })
  const [roles, setRoles] = useState<RoleOption[]>([])

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admin-users")
      if (!res.ok) throw new Error("Failed to load users")
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles")
      if (!res.ok) throw new Error("Failed to load roles")
      const data = await res.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Error loading roles:", error)
      toast({
        title: "Error",
        description: "Failed to load roles for admin users",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [loadUsers, loadRoles])

  async function handleCreateUser() {
    try {
      if (!newUser.email || !newUser.roleId) {
        toast({
          title: "Error",
          description: "Email and role are required",
          variant: "destructive",
        })
        return
      }

      const res = await fetch("/api/admin/admin-users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name || undefined,
          roleId: newUser.roleId,
          sendInviteEmail: newUser.sendInviteEmail,
        }),
      })

      if (!res.ok) throw new Error("Failed to create user")

      const result = await res.json()

      await loadUsers()
      setDialogOpen(false)
      setNewUser({ email: "", name: "", roleId: "", sendInviteEmail: true })

      if (!newUser.sendInviteEmail && result?.tempPassword) {
        toast({
          title: "Admin user created",
          description:
            "Temporary password generated. Please share it securely with the user.",
        })
        // In a real UI, you might show this in a secure one-time modal instead of toast
        console.info("Temp password (one-time):", result.tempPassword)
      } else {
        toast({
          title: "Success",
          description: "Admin user created and invitation email requested.",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive",
      })
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    try {
      const reason = prompt("Reason for changing user status:")
      if (!reason) return

      const res = await fetch(`/api/admin/admin-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !currentActive,
          reason,
        }),
      })

      if (!res.ok) throw new Error("Failed to update user")

      await loadUsers()

      toast({
        title: "Success",
        description: `User ${!currentActive ? "activated" : "deactivated"}`,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Manage admin user accounts and access</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user by email and assign an admin role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="roleId">Role *</Label>
                <select
                  id="roleId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newUser.roleId}
                  onChange={(e) =>
                    setNewUser({ ...newUser, roleId: e.target.value })
                  }
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="sendInviteEmail"
                  type="checkbox"
                  checked={newUser.sendInviteEmail}
                  onChange={(e) =>
                    setNewUser({ ...newUser, sendInviteEmail: e.target.checked })
                  }
                  className="h-4 w-4 rounded border border-input"
                />
                <Label htmlFor="sendInviteEmail" className="text-sm">
                  Send invite email (recommended)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                If you turn off invite email, a one-time temporary password will be generated
                and must be shared securely with the user. They will be required to reset it
                on first login.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>List of all admin users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No admin users found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.userId}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          ) : (
                            user.roles.map((ur) => (
                              <Badge key={ur.role.id} variant="outline">
                                {ur.role.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
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
