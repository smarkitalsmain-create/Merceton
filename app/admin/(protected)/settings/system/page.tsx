"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface SystemSettings {
  id: string
  maintenanceMode: boolean
  maintenanceBanner?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  enableCustomDomains: boolean
  enablePayouts: boolean
  enablePlatformInvoices: boolean
}

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/system-settings")
      if (!res.ok) throw new Error("Failed to load settings")
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const reason = prompt("Reason for updating system settings:")
      if (!reason) {
        setSaving(false)
        return
      }

      const data: Partial<SystemSettings> & { reason: string } = {
        maintenanceMode: settings.maintenanceMode,
        maintenanceBanner: formData.get("maintenanceBanner") as string || null,
        supportEmail: formData.get("supportEmail") as string || null,
        supportPhone: formData.get("supportPhone") as string || null,
        enableCustomDomains: settings.enableCustomDomains,
        enablePayouts: settings.enablePayouts,
        enablePlatformInvoices: settings.enablePlatformInvoices,
        reason,
      }

      const res = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to save")

      const updated = await res.json()
      setSettings(updated)

      toast({
        title: "Success",
        description: "System settings updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Failed to load settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure feature flags, maintenance mode, and support contact information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>Control platform-wide maintenance banner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show maintenance banner to all users
                </p>
              </div>
              <input
                type="hidden"
                name="maintenanceMode"
                value={settings.maintenanceMode ? "on" : "off"}
              />
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
            <div>
              <Label htmlFor="maintenanceBanner">Maintenance Banner Text</Label>
              <Textarea
                id="maintenanceBanner"
                name="maintenanceBanner"
                defaultValue={settings.maintenanceBanner || ""}
                rows={3}
                placeholder="e.g., We're performing scheduled maintenance. Services will resume shortly."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Contact</CardTitle>
            <CardDescription>Contact information displayed to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={settings.supportEmail || ""}
                  placeholder="support@merceton.com"
                />
              </div>
              <div>
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  name="supportPhone"
                  defaultValue={settings.supportPhone || ""}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableCustomDomains">Custom Domains</Label>
                <p className="text-sm text-muted-foreground">
                  Allow merchants to connect custom domains
                </p>
              </div>
              <input
                type="hidden"
                name="enableCustomDomains"
                value={settings.enableCustomDomains ? "on" : "off"}
              />
              <Switch
                id="enableCustomDomains"
                checked={settings.enableCustomDomains}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableCustomDomains: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePayouts">Payouts</Label>
                <p className="text-sm text-muted-foreground">
                  Enable payout processing for merchants
                </p>
              </div>
              <input
                type="hidden"
                name="enablePayouts"
                value={settings.enablePayouts ? "on" : "off"}
              />
              <Switch
                id="enablePayouts"
                checked={settings.enablePayouts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePayouts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePlatformInvoices">Platform Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Enable platform invoice generation
                </p>
              </div>
              <input
                type="hidden"
                name="enablePlatformInvoices"
                value={settings.enablePlatformInvoices ? "on" : "off"}
              />
              <Switch
                id="enablePlatformInvoices"
                checked={settings.enablePlatformInvoices}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePlatformInvoices: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
