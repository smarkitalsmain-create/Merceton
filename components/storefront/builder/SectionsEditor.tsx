"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { StorefrontSection } from "@/lib/storefront/core/config/schema"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SectionsEditorProps {
  sections: StorefrontSection[]
  merchantSlug: string
  onChange: (sections: StorefrontSection[]) => void
}

export function SectionsEditor({ sections, merchantSlug, onChange }: SectionsEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const addSection = (type: StorefrontSection["type"]) => {
    const id = `${type}-${Date.now()}`
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) : -1
    let newSection: StorefrontSection

    switch (type) {
      case "hero":
        newSection = {
          id,
          type: "hero",
          order: maxOrder + 1,
          isVisible: true,
          settings: {
            headline: "Welcome to our store",
            subheadline: "Edit this hero section in the builder",
            ctaText: "Shop Now",
            ctaLink: `/s/${merchantSlug}`,
          },
        }
        break
      case "text":
        newSection = {
          id,
          type: "text",
          order: maxOrder + 1,
          isVisible: true,
          settings: {
            title: "Section title",
            body: "Section body text...",
          },
        }
        break
      case "productGrid":
        newSection = {
          id,
          type: "productGrid",
          order: maxOrder + 1,
          isVisible: true,
          settings: {
            title: "Featured products",
            collection: "featured",
            limit: 8,
          },
        }
        break
      case "banner":
        newSection = {
          id,
          type: "banner",
          order: maxOrder + 1,
          isVisible: true,
          settings: {
            text: "Store announcement banner text",
            link: "",
          },
        }
        break
    }

    onChange([...sections, newSection])
    setSelectedIndex(sections.length)
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= sections.length) return

    const updated = [...sections]
    const [moved] = updated.splice(index, 1)
    moved.order = updated[newIndex].order
    updated[newIndex].order = sections[index].order
    updated.splice(newIndex, 0, moved)

    // Reorder all sections
    updated.forEach((s, idx) => {
      s.order = idx
    })

    onChange(updated)
    setSelectedIndex(newIndex)
  }

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index))
    setSelectedIndex(null)
  }

  const toggleVisibility = (index: number) => {
    const updated = [...sections]
    updated[index].isVisible = !updated[index].isVisible
    onChange(updated)
  }

  const updateSectionSettings = (index: number, settings: any) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], settings }
    onChange(updated)
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div className="grid gap-6 md:grid-cols-[280px,1fr]">
      {/* Left: Sections list */}
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Reorder and manage page sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {sortedSections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No sections yet. Add a section to get started.
              </p>
            )}
            {sortedSections.map((section, idx) => {
              const originalIndex = sections.findIndex((s) => s.id === section.id)
              return (
                <div
                  key={section.id}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                    selectedIndex === originalIndex
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedIndex(originalIndex)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {!section.isVisible && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex flex-col flex-1">
                      <span className="font-medium capitalize">{section.type}</span>
                      <span className="text-xs text-muted-foreground">
                        Order {section.order + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(originalIndex)
                      }}
                    >
                      {section.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSection(originalIndex, -1)
                      }}
                      disabled={originalIndex === 0}
                    >
                      <ArrowUpDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSection(originalIndex)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <Label>Add section</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("hero")}
              >
                <Plus className="h-3 w-3 mr-1" /> Hero
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("text")}
              >
                <Plus className="h-3 w-3 mr-1" /> Text
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("productGrid")}
              >
                <Plus className="h-3 w-3 mr-1" /> Products
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("banner")}
              >
                <Plus className="h-3 w-3 mr-1" /> Banner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Section editor */}
      <Card>
        <CardHeader>
          <CardTitle>Section settings</CardTitle>
          <CardDescription>Edit the selected section</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedIndex === null || !sections[selectedIndex] ? (
            <p className="text-sm text-muted-foreground">
              Select a section from the left to edit its settings.
            </p>
          ) : (
            <SectionSettingsEditor
              section={sections[selectedIndex]}
              onChange={(settings) => updateSectionSettings(selectedIndex, settings)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SectionSettingsEditorProps {
  section: StorefrontSection
  onChange: (settings: any) => void
}

function SectionSettingsEditor({ section, onChange }: SectionSettingsEditorProps) {
  switch (section.type) {
    case "hero": {
      const settings = section.settings as Extract<StorefrontSection, { type: "hero" }>["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={settings.headline}
              onChange={(e) => onChange({ ...settings, headline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Textarea
              value={settings.subheadline || ""}
              onChange={(e) => onChange({ ...settings, subheadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Text</Label>
            <Input
              value={settings.ctaText || ""}
              onChange={(e) => onChange({ ...settings, ctaText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Link</Label>
            <Input
              value={settings.ctaLink || ""}
              onChange={(e) => onChange({ ...settings, ctaLink: e.target.value })}
            />
          </div>
        </div>
      )
    }
    case "text": {
      const settings = section.settings as Extract<StorefrontSection, { type: "text" }>["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={settings.title}
              onChange={(e) => onChange({ ...settings, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={settings.body}
              onChange={(e) => onChange({ ...settings, body: e.target.value })}
            />
          </div>
        </div>
      )
    }
    case "productGrid": {
      const settings = section.settings as Extract<
        StorefrontSection,
        { type: "productGrid" }
      >["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={settings.title}
              onChange={(e) => onChange({ ...settings, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Collection</Label>
            <Select
              value={settings.collection}
              onValueChange={(value) =>
                onChange({ ...settings, collection: value as "all" | "featured" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="featured">Featured products</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              min={1}
              max={48}
              value={settings.limit}
              onChange={(e) =>
                onChange({ ...settings, limit: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
      )
    }
    case "banner": {
      const settings = section.settings as Extract<StorefrontSection, { type: "banner" }>["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Text</Label>
            <Input
              value={settings.text}
              onChange={(e) => onChange({ ...settings, text: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <Input
              value={settings.link || ""}
              onChange={(e) => onChange({ ...settings, link: e.target.value })}
            />
          </div>
        </div>
      )
    }
    default:
      return (
        <p className="text-sm text-muted-foreground">Unsupported section type.</p>
      )
  }
}
