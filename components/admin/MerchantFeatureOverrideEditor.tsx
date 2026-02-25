"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { setMerchantFeatureOverride } from "@/app/actions/features"
import { GROWTH_FEATURES_BY_CATEGORY } from "@/lib/features/featureKeys"
import { Loader2 } from "lucide-react"

interface ResolvedFeature {
  featureId: string
  key: string
  name: string
  enabled: boolean
  source: string
}

interface MerchantFeatureOverrideEditorProps {
  merchantId: string
  resolvedFeatures: ResolvedFeature[]
}

type OverrideMode = "NONE" | "ENABLE" | "DISABLE"

export function MerchantFeatureOverrideEditor({
  merchantId,
  resolvedFeatures,
}: MerchantFeatureOverrideEditorProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [overrides, setOverrides] = useState<Record<string, OverrideMode>>({})

  const getEffectiveMode = (f: ResolvedFeature): OverrideMode => {
    if (overrides[f.featureId] !== undefined) return overrides[f.featureId]
    if (f.source === "override") return f.enabled ? "ENABLE" : "DISABLE"
    return "NONE"
  }

  const handleChange = (featureId: string, mode: OverrideMode) => {
    setOverrides((prev) => ({ ...prev, [featureId]: mode }))
    startTransition(async () => {
      try {
        await setMerchantFeatureOverride(
          merchantId,
          featureId,
          mode,
          undefined,
          mode === "NONE" ? "Remove override" : "Admin override from merchant pricing"
        )
        toast({
          title: "Override updated",
          description: mode === "NONE" ? "Using package default" : `Feature ${mode === "ENABLE" ? "enabled" : "disabled"}.`,
        })
        setOverrides((prev) => {
          const next = { ...prev }
          delete next[featureId]
          return next
        })
      } catch (err: unknown) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update override",
          variant: "destructive",
        })
      }
    })
  }

  const bySection = new Map<string, ResolvedFeature[]>()
  const categoryKeys = new Set<string>()
  for (const [section, keys] of Object.entries(GROWTH_FEATURES_BY_CATEGORY)) {
    keys.forEach((k) => categoryKeys.add(k))
    for (const f of resolvedFeatures) {
      if (keys.includes(f.key as any)) {
        if (!bySection.has(section)) bySection.set(section, [])
        bySection.get(section)!.push(f)
      }
    }
  }
  const uncategorized = resolvedFeatures.filter((f) => !categoryKeys.has(f.key))
  if (uncategorized.length > 0) bySection.set("Other", uncategorized)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature overrides</CardTitle>
        <CardDescription>
          Override package features for this merchant. Package default uses the assigned pricing package.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from(bySection.entries()).map(([sectionName, features]) => (
          <div key={sectionName} className="space-y-3">
            <Label className="text-sm font-semibold">{sectionName}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.featureId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.enabled ? "On" : "Off"}
                      {f.source === "override" && " (overridden)"}
                    </p>
                  </div>
                  <Select
                    value={getEffectiveMode(f)}
                    onValueChange={(v) => handleChange(f.featureId, v as OverrideMode)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Package default</SelectItem>
                      <SelectItem value="ENABLE">Enable</SelectItem>
                      <SelectItem value="DISABLE">Disable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </div>
        )}
      </CardContent>
    </Card>
  )
}
