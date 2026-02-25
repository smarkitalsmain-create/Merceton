"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export interface FeatureSelection {
  featureId: string
  enabled: boolean
  valueJson?: unknown
}

interface ApiFeature {
  id: string
  key: string
  name: string
  description: string | null
  category: string | null
  isBeta: boolean | null
  valueType: string
}

interface PackageFeatureSelectProps {
  value: FeatureSelection[]
  onChange: (value: FeatureSelection[]) => void
  disabled?: boolean
}

export function PackageFeatureSelect({
  value,
  onChange,
  disabled = false,
}: PackageFeatureSelectProps) {
  const [grouped, setGrouped] = useState<Record<string, ApiFeature[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/features")
      .then(async (r) => {
        const text = await r.text()
        if (!r.ok) {
          let msg = text || `Failed to load features (${r.status})`
          try {
            if (text) {
              const j = JSON.parse(text)
              if (typeof j?.error === "string") msg = j.error
              else if (j?.error?.message) msg = j.error.message
            }
          } catch {
            // use msg as-is
          }
          throw new Error(msg)
        }
        if (!text || !text.trim()) {
          setGrouped({})
          setError(null)
          return
        }
        try {
          const data = JSON.parse(text)
          setGrouped(data?.grouped ?? {})
          setError(null)
        } catch {
          setGrouped({})
          setError("Invalid response from server")
        }
      })
      .catch((e) => {
        console.error("Feature load failed:", e)
        setGrouped({})
        setError(e instanceof Error ? e.message : "Failed to load features")
      })
      .finally(() => setLoading(false))
  }, [])

  const valueMap = new Map(value.map((v) => [v.featureId, v]))

  function toggle(featureId: string, enabled: boolean, valueJson?: unknown) {
    const next = value.filter((v) => v.featureId !== featureId)
    next.push({ featureId, enabled, valueJson: enabled ? valueJson : undefined })
    onChange(next)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Loading features...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <span className="animate-pulse">Loading…</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categories = Object.keys(grouped).sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Features</CardTitle>
        <CardDescription>
          Growth-only features. Starter has none; enable these for Growth plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}
        {categories.length === 0 && !error && (
          <p className="text-muted-foreground text-sm py-4">No features found. Run database seed to add features.</p>
        )}
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground capitalize mb-3">
              {category}
            </h3>
            <div className="space-y-3">
              {grouped[category].map((f) => {
                const sel = valueMap.get(f.id)
                const enabled = sel?.enabled ?? false
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={`feat-${f.id}`}
                        checked={enabled}
                        onCheckedChange={(checked) => toggle(f.id, !!checked)}
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`feat-${f.id}`}
                        className="font-medium cursor-pointer flex-1"
                      >
                        {f.name}
                        {f.isBeta && (
                          <span className="ml-2 text-xs text-amber-600">Beta</span>
                        )}
                      </Label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
