"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Rocket, AlertTriangle } from "lucide-react"

interface StorefrontSettingsFormProps {
  merchantId: string
}

type StorefrontMode = "THEME" | "CUSTOM_CODE"

interface StorefrontSettings {
  id: string
  mode: StorefrontMode
  theme: string | null
  themeConfig: any
  customHtml: string | null
  customCss: string | null
  customJs: string | null
  publishedAt: Date | null
}

export function StorefrontSettingsForm({ merchantId }: StorefrontSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<StorefrontSettings | null>(null)

  // Mode state
  const [mode, setMode] = useState<StorefrontMode>("THEME")

  // Theme state
  const [theme, setTheme] = useState("minimal")
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [headingFont, setHeadingFont] = useState("Inter")
  const [buttonStyle, setButtonStyle] = useState("rounded")

  // Custom code state
  const [customHtml, setCustomHtml] = useState("")
  const [customCss, setCustomCss] = useState("")
  const [customJs, setCustomJs] = useState("")

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/storefront/settings")
        if (!response.ok) {
          throw new Error("Failed to load settings")
        }
        const data = await response.json()
        const loadedSettings = data.settings

        setSettings(loadedSettings)
        setMode(loadedSettings.mode || "THEME")
        setTheme(loadedSettings.theme || "minimal")

        // Load theme config
        const config = loadedSettings.themeConfig || {}
        setPrimaryColor(config.primaryColor || "#000000")
        setHeadingFont(config.headingFont || "Inter")
        setButtonStyle(config.buttonStyle || "rounded")

        // Load custom code
        setCustomHtml(loadedSettings.customHtml || "")
        setCustomCss(loadedSettings.customCss || "")
        setCustomJs(loadedSettings.customJs || "")

        setIsLoading(false)
      } catch (error: any) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load storefront settings",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleSave = () => {
    startTransition(async () => {
      try {
        const body: any = {
          mode,
        }

        if (mode === "THEME") {
          body.theme = theme
          body.themeConfig = {
            primaryColor,
            headingFont,
            buttonStyle,
          }
        } else {
          body.customHtml = customHtml
          body.customCss = customCss
          body.customJs = customJs
        }

        const response = await fetch("/api/storefront/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save settings")
        }

        const data = await response.json()
        setSettings(data.settings)
        toast({
          title: "Settings saved",
          description: "Your storefront settings have been saved successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save settings",
          variant: "destructive",
        })
      }
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/storefront/publish", {
          method: "POST",
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to publish")
        }

        const data = await response.json()
        setSettings((prev) =>
          prev ? { ...prev, publishedAt: new Date(data.publishedAt) } : null
        )
        toast({
          title: "Published",
          description: "Your storefront has been published successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to publish",
          variant: "destructive",
        })
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Storefront Mode</CardTitle>
          <CardDescription>Choose how to build your storefront</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("THEME")}
              className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                mode === "THEME"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">Theme</div>
              <div className="text-sm text-muted-foreground mt-1">
                Use pre-built themes with simple customization
              </div>
            </button>
            <button
              onClick={() => setMode("CUSTOM_CODE")}
              className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                mode === "CUSTOM_CODE"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">Custom Code</div>
              <div className="text-sm text-muted-foreground mt-1">
                Write your own HTML, CSS, and JavaScript
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Editor */}
      {mode === "THEME" && (
        <Card>
          <CardHeader>
            <CardTitle>Theme Settings</CardTitle>
            <CardDescription>Customize your theme appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
                <option value="classic">Classic</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <Input
                id="headingFont"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                placeholder="Inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonStyle">Button Style</Label>
              <select
                id="buttonStyle"
                value={buttonStyle}
                onChange={(e) => setButtonStyle(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="pill">Pill</option>
              </select>
            </div>

            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Theme
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Code Editor */}
      {mode === "CUSTOM_CODE" && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Code</CardTitle>
            <CardDescription>
              Write your own HTML, CSS, and JavaScript for your storefront
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Security Warning
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Custom code runs on your storefront. Only use code from trusted sources.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customHtml">HTML *</Label>
              <Textarea
                id="customHtml"
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder="<div>Your custom HTML here</div>"
                className="font-mono text-sm min-h-[200px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                {customHtml.length} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customCss">CSS</Label>
              <Textarea
                id="customCss"
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder="/* Your custom CSS here */"
                className="font-mono text-sm min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {customCss.length} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customJs">JavaScript</Label>
              <Textarea
                id="customJs"
                value={customJs}
                onChange={(e) => setCustomJs(e.target.value)}
                placeholder="// Your custom JavaScript here"
                className="font-mono text-sm min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {customJs.length} characters
              </p>
            </div>

            <Button onClick={handleSave} disabled={isPending || !customHtml.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Publish Section */}
      <Card>
        <CardHeader>
          <CardTitle>Publish</CardTitle>
          <CardDescription>
            Make your storefront live for customers to see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.publishedAt && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Published</Badge>
              <span className="text-sm text-muted-foreground">
                Last published: {new Date(settings.publishedAt).toLocaleString()}
              </span>
            </div>
          )}

          <Button onClick={handlePublish} disabled={isPending} size="lg">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Publish Storefront
              </>
            )}
          </Button>

          {!settings?.publishedAt && (
            <p className="text-sm text-muted-foreground">
              Your storefront is not published yet. Customers will see a "Store not published" message.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
