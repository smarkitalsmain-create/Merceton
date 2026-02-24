"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save, Rocket, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StorefrontConfig, StorefrontSection } from "@/lib/storefront/core/config/schema"
import { ThemeEditor } from "./ThemeEditor"
import { SectionsEditor } from "./SectionsEditor"
import { BrandingEditor } from "./BrandingEditor"
import { LivePreview } from "./LivePreview"

interface StorefrontBuilderProps {
  merchantSlug: string
  merchantId: string
  initialConfig: StorefrontConfig
  initialIsPublished: boolean
}

export function StorefrontBuilder({
  merchantSlug,
  merchantId,
  initialConfig,
  initialIsPublished,
}: StorefrontBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [config, setConfig] = useState<StorefrontConfig>(initialConfig)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState("sections")

  // Update config handlers
  const updateTheme = (theme: StorefrontConfig["theme"]) => {
    setConfig((prev) => ({ ...prev, theme }))
  }

  const updateLayout = (sections: StorefrontSection[]) => {
    setConfig((prev) => ({ ...prev, layout: { sections } }))
  }

  const updateBranding = (branding: StorefrontConfig["branding"]) => {
    setConfig((prev) => ({ ...prev, branding }))
  }

  const updateSEO = (seo: StorefrontConfig["seo"]) => {
    setConfig((prev) => ({ ...prev, seo }))
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/storefront/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          isDraft: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to save draft")
      }

      toast({
        title: "Draft saved",
        description: "Your changes have been saved as draft.",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save draft",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch("/api/storefront/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          isDraft: false,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to publish")
      }

      setIsPublished(true)
      toast({
        title: "Published",
        description: "Your storefront is now live!",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to publish",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with status and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storefront Builder</h1>
          <p className="text-muted-foreground">
            Customize your storefront theme, sections, and branding
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isPublished ? "default" : "outline"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Rocket className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main builder with tabs and preview */}
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Left: Editor Tabs (fixed width, scrollable) */}
        <div className="w-[520px] min-w-[420px] flex-shrink-0 overflow-y-auto pr-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="branding">Branding & SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="mt-4">
              <SectionsEditor
                sections={config.layout.sections}
                merchantSlug={merchantSlug}
                onChange={updateLayout}
              />
            </TabsContent>

            <TabsContent value="theme" className="mt-4">
              <ThemeEditor theme={config.theme} onChange={updateTheme} />
            </TabsContent>

            <TabsContent value="branding" className="mt-4">
              <BrandingEditor
                branding={config.branding}
                seo={config.seo}
                merchantId={merchantId}
                onChange={updateBranding}
                onSEOChange={updateSEO}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Preview (flexible width) */}
        <div className="flex-1 min-w-0">
          <LivePreview
            config={config}
            merchantSlug={merchantSlug}
          />
        </div>
      </div>
    </div>
  )
}
