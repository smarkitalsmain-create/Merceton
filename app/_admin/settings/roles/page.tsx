"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Shield, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Array<{
    permission: {
      id: string
      key: string
      label: string
    }
  }>
}

interface Permission {
  id: string
  key: string
  label: string
}

export default function RolesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
  })

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles")
      if (!res.ok) throw new Error("Failed to load roles")
      const data = await res.json()
      setRoles(data.roles)
      setAllPermissions(data.allPermissions)
    } catch (error) {
      console.error("Error loading roles:", error)
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  function openEditDialog(role: Role) {
    setEditingRole(role)
    setSelectedPermissions(new Set(role.permissions.map((p) => p.permission.id)))
    setNewRole({
      name: role.name,
      description: role.description || "",
    })
    setDialogOpen(true)
  }

  function openCreateDialog() {
    setEditingRole(null)
    setSelectedPermissions(new Set())
    setNewRole({ name: "", description: "" })
    setDialogOpen(true)
  }

  function togglePermission(permissionId: string) {
    const newSet = new Set(selectedPermissions)
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId)
    } else {
      newSet.add(permissionId)
    }
    setSelectedPermissions(newSet)
  }

  async function handleSaveRole() {
    try {
      const reason = prompt("Reason for saving role:")
      if (!reason) return

      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : "/api/admin/roles"
      const method = editingRole ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRole.name,
          description: newRole.description || null,
          permissionIds: Array.from(selectedPermissions),
          reason,
        }),
      })

      if (!res.ok) throw new Error("Failed to save role")

      await loadRoles()
      setDialogOpen(false)

      toast({
        title: "Success",
        description: `Role ${editingRole ? "updated" : "created"} successfully`,
      })
    } catch (error) {
      console.error("Error saving role:", error)
      toast({
        title: "Error",
        description: "Failed to save role",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const reason = prompt("Reason for deleting role:")
      if (!reason) return

      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) throw new Error("Failed to delete role")

      await loadRoles()

      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Configure roles and permission matrix</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role details and permissions"
                : "Create a new role and assign permissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Billing Manager"
                required
              />
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                rows={2}
                placeholder="Role description"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {allPermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={selectedPermissions.has(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <Label
                      htmlFor={`perm-${perm.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      <div className="font-medium">{perm.label}</div>
                      <div className="text-xs text-muted-foreground">{perm.key}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!newRole.name}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>List of all roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No roles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {role.name}
                          {role.isSystem && (
                            <Badge variant="secondary" className="ml-2">System</Badge>
                          )}
                        </CardTitle>
                        {role.description && (
                          <CardDescription>{role.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                        >
                          Edit
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No permissions</span>
                      ) : (
                        role.permissions.map((rp) => (
                          <Badge key={rp.permission.id} variant="outline">
                            {rp.permission.label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
