"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Plus, Trash2, Save, Eye, Rocket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SectionType = "hero" | "text" | "productGrid" | "banner" | "footer"

interface BaseSection {
  id: string
  type: SectionType
}

interface HeroSection extends BaseSection {
  type: "hero"
  settings: {
    headline: string
    subheadline?: string
    ctaText?: string
    ctaLink?: string
  }
}

interface TextSection extends BaseSection {
  type: "text"
  settings: {
    title: string
    body: string
  }
}

interface ProductGridSection extends BaseSection {
  type: "productGrid"
  settings: {
    title: string
    collection: "all" | "featured"
    limit: number
  }
}

interface BannerSection extends BaseSection {
  type: "banner"
  settings: {
    text: string
    link?: string
  }
}

interface FooterSection extends BaseSection {
  type: "footer"
  settings: {
    brandName: string
    links: Array<{ label: string; href: string }>
  }
}

export type StorefrontSection =
  | HeroSection
  | TextSection
  | ProductGridSection
  | BannerSection
  | FooterSection

interface StorefrontPageBuilderProps {
  merchantSlug: string
  initialTitle: string
  initialIsPublished: boolean
  initialLayout: StorefrontSection[]
}

export function StorefrontPageBuilder({
  merchantSlug,
  initialTitle,
  initialIsPublished,
  initialLayout,
}: StorefrontPageBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState(initialTitle)
  const [sections, setSections] = useState<StorefrontSection[]>(initialLayout)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const selectedSection = sections[selectedIndex]

  const addSection = (type: SectionType) => {
    const id = `${type}-${Date.now()}`
    let newSection: StorefrontSection

    switch (type) {
      case "hero":
        newSection = {
          id,
          type: "hero",
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
          settings: {
            text: "Store announcement banner text",
            link: "",
          },
        }
        break
      case "footer":
      default:
        newSection = {
          id,
          type: "footer",
          settings: {
            brandName: "Your brand",
            links: [],
          },
        }
        break
    }

    setSections((prev) => [...prev, newSection])
    setSelectedIndex(sections.length)
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= sections.length) return
    setSections((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(index, 1)
      copy.splice(newIndex, 0, moved)
      return copy
    })
    setSelectedIndex(newIndex)
  }

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index))
    setSelectedIndex((prevIndex) =>
      prevIndex > index ? prevIndex - 1 : Math.max(0, prevIndex - 1)
    )
  }

  const updateSectionSettings = (index: number, settings: any) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === index ? ({ ...section, settings } as StorefrontSection) : section
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/storefront/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "home",
          title,
          layoutJson: { sections },
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to save page")
      }

      toast({
        title: "Saved",
        description: "Your page layout has been saved.",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Storefront page save error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save page layout",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishToggle = async (nextPublished: boolean) => {
    setIsPublishing(true)
    try {
      const response = await fetch("/api/storefront/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "home",
          title,
          layoutJson: { sections },
          isPublished: nextPublished,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to update publish state")
      }

      setIsPublished(nextPublished)
      toast({
        title: nextPublished ? "Published" : "Unpublished",
        description: nextPublished
          ? "Your storefront home page is now live."
          : "Your storefront home page is now in draft.",
      })
      router.refresh()
    } catch (error: any) {
      console.error("Storefront page publish error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update publish state",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    window.open(`/s/${merchantSlug}?preview=true`, "_blank")
  }

  return (
    <div className="grid gap-6 md:grid-cols-[280px,1fr]">
      {/* Left: Sections list */}
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Reorder and manage page sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? "default" : "outline"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No sections yet. Add a section to get started.
              </p>
            )}
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                  selectedIndex === index ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="flex flex-col">
                  <span className="font-medium capitalize">{section.type}</span>
                  <span className="text-xs text-muted-foreground">
                    Section {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveSection(index, -1)
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSection(index)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Add section</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("hero")}>
                <Plus className="h-3 w-3 mr-1" /> Hero
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSection("text")}>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("footer")}
              >
                <Plus className="h-3 w-3 mr-1" /> Footer
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Page title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Home"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handlePublishToggle(!isPublished)}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Rocket className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : isPublished ? (
                  "Unpublish"
                ) : (
                  "Publish"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handlePreview}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
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
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select "Add section" to start building your page.
            </p>
          ) : !selectedSection ? (
            <p className="text-sm text-muted-foreground">
              Select a section from the left to edit its settings.
            </p>
          ) : (
            <SectionEditor
              section={selectedSection}
              onChange={(settings) =>
                updateSectionSettings(selectedIndex, settings)
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SectionEditorProps {
  section: StorefrontSection
  onChange: (settings: any) => void
}

function SectionEditor({ section, onChange }: SectionEditorProps) {
  switch (section.type) {
    case "hero": {
      const settings = section.settings as HeroSection["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={settings.headline}
              onChange={(e) =>
                onChange({ ...settings, headline: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Textarea
              value={settings.subheadline || ""}
              onChange={(e) =>
                onChange({ ...settings, subheadline: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Text</Label>
            <Input
              value={settings.ctaText || ""}
              onChange={(e) =>
                onChange({ ...settings, ctaText: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Link</Label>
            <Input
              value={settings.ctaLink || ""}
              onChange={(e) =>
                onChange({ ...settings, ctaLink: e.target.value })
              }
            />
          </div>
        </div>
      )
    }
    case "text": {
      const settings = section.settings as TextSection["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={settings.title}
              onChange={(e) =>
                onChange({ ...settings, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={settings.body}
              onChange={(e) =>
                onChange({ ...settings, body: e.target.value })
              }
            />
          </div>
        </div>
      )
    }
    case "productGrid": {
      const settings = section.settings as ProductGridSection["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={settings.title}
              onChange={(e) =>
                onChange({ ...settings, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Collection</Label>
            <select
              value={settings.collection}
              onChange={(e) =>
                onChange({
                  ...settings,
                  collection: e.target.value as "all" | "featured",
                })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All products</option>
              <option value="featured">Featured products</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              min={1}
              max={48}
              value={settings.limit}
              onChange={(e) =>
                onChange({
                  ...settings,
                  limit: Number(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>
      )
    }
    case "banner": {
      const settings = section.settings as BannerSection["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Text</Label>
            <Input
              value={settings.text}
              onChange={(e) =>
                onChange({ ...settings, text: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <Input
              value={settings.link || ""}
              onChange={(e) =>
                onChange({ ...settings, link: e.target.value })
              }
            />
          </div>
        </div>
      )
    }
    case "footer": {
      const settings = section.settings as FooterSection["settings"]
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Brand name</Label>
            <Input
              value={settings.brandName}
              onChange={(e) =>
                onChange({ ...settings, brandName: e.target.value })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Footer links editing is not available yet in this version.
          </p>
        </div>
      )
    }
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unsupported section type.
        </p>
      )
  }
}

