"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updatePlatformSettings } from "@/app/actions/admin"
import { Save } from "lucide-react"

interface PlatformSettings {
  id: string
  defaultFeePercentageBps: number | null
  defaultFeeFlatPaise: number | null
  defaultFeeMaxCapPaise: number | null
  updatedAt: Date
}

interface PlatformSettingsFormProps {
  initialSettings: PlatformSettings
}

export function PlatformSettingsForm({ initialSettings }: PlatformSettingsFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState({
    defaultFeePercentageBps: initialSettings.defaultFeePercentageBps?.toString() || "200",
    defaultFeeFlatPaise: initialSettings.defaultFeeFlatPaise?.toString() || "500",
    defaultFeeMaxCapPaise: initialSettings.defaultFeeMaxCapPaise?.toString() || "2500",
  })

  const handleSave = () => {
    const reason = prompt("Reason for updating platform settings:")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await updatePlatformSettings(
          {
            defaultFeePercentageBps: parseInt(settings.defaultFeePercentageBps) || null,
            defaultFeeFlatPaise: parseInt(settings.defaultFeeFlatPaise) || null,
            defaultFeeMaxCapPaise: parseInt(settings.defaultFeeMaxCapPaise) || null,
          },
          reason
        )

        if (result.success) {
          toast({
            title: "Success",
            description: "Platform settings updated",
          })
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to update settings",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Defaults</CardTitle>
        <CardDescription>
          Configure default fee settings for new merchants. These can be overridden per merchant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="feePercentageBps">Default Fee Percentage (basis points)</Label>
          <Input
            id="feePercentageBps"
            type="number"
            value={settings.defaultFeePercentageBps}
            onChange={(e) => setSettings({ ...settings, defaultFeePercentageBps: e.target.value })}
            placeholder="200"
          />
          <p className="text-xs text-muted-foreground">
            {settings.defaultFeePercentageBps
              ? `${parseInt(settings.defaultFeePercentageBps) / 100}%`
              : "2% default"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feeFlatPaise">Default Flat Fee (paise)</Label>
          <Input
            id="feeFlatPaise"
            type="number"
            value={settings.defaultFeeFlatPaise}
            onChange={(e) => setSettings({ ...settings, defaultFeeFlatPaise: e.target.value })}
            placeholder="500"
          />
          <p className="text-xs text-muted-foreground">
            {settings.defaultFeeFlatPaise
              ? `₹${(parseInt(settings.defaultFeeFlatPaise) / 100).toFixed(2)}`
              : "₹5.00 default"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feeMaxCapPaise">Default Max Cap (paise)</Label>
          <Input
            id="feeMaxCapPaise"
            type="number"
            value={settings.defaultFeeMaxCapPaise}
            onChange={(e) => setSettings({ ...settings, defaultFeeMaxCapPaise: e.target.value })}
            placeholder="2500"
          />
          <p className="text-xs text-muted-foreground">
            {settings.defaultFeeMaxCapPaise
              ? `₹${(parseInt(settings.defaultFeeMaxCapPaise) / 100).toFixed(2)}`
              : "₹25.00 default"}
          </p>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
