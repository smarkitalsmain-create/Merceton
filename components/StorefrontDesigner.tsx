"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Palette, Code, Upload, X } from "lucide-react"
import { uploadToCloudinary } from "@/lib/cloudinary"
import Image from "next/image"

type StorefrontMode = "THEME" | "CUSTOM_CODE"

interface StorefrontSettings {
  id: string
  mode: StorefrontMode
  themeConfig: any
  customHtml: string | null
  customCss: string | null
  customJs: string | null
  publishedAt: Date | null
  logoUrl: string | null
  theme: string
}

interface StorefrontDesignerProps {
  merchantId: string
  merchantName: string
  storefront: StorefrontSettings
}

export function StorefrontDesigner({
  merchantId,
  merchantName,
  storefront: initialStorefront,
}: StorefrontDesignerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<StorefrontMode>(initialStorefront.mode || "THEME")
  const [storefront, setStorefront] = useState(initialStorefront)

  // Sync active tab with storefront mode
  useEffect(() => {
    setActiveTab(storefront.mode || "THEME")
  }, [storefront.mode])

  // Theme Designer state
  const [storeTitle, setStoreTitle] = useState(
    (storefront.themeConfig as any)?.storeTitle || merchantName
  )
  const [logoUrl, setLogoUrl] = useState(storefront.logoUrl || "")
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadProgress, setLogoUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [primaryColor, setPrimaryColor] = useState(
    (storefront.themeConfig as any)?.primaryColor || "#000000"
  )
  const [theme, setTheme] = useState(
    (storefront.themeConfig as any)?.theme || storefront.theme || "minimal"
  )

  // Custom Code state
  const [customHtml, setCustomHtml] = useState(storefront.customHtml || "")
  const [customCss, setCustomCss] = useState(storefront.customCss || "")
  const [customJs, setCustomJs] = useState(storefront.customJs || "")

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setLogoUploading(true)
    setLogoUploadProgress(0)

    try {
      const result = await uploadToCloudinary(file, (progress) => {
        setLogoUploadProgress(progress)
      })
      setLogoUrl(result.url)
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setLogoUploading(false)
      setLogoUploadProgress(0)
      // Reset file input
      setFileInputKey((prev) => prev + 1)
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl("")
    setFileInputKey((prev) => prev + 1)
  }

  const handleSaveTheme = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/storefront/save-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeTitle,
            logoUrl,
            primaryColor,
            theme,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save theme")
        }

        const data = await response.json()
        setStorefront(data.storefront)
        toast({
          title: "Theme saved",
          description: "Your storefront theme has been saved successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save theme",
          variant: "destructive",
        })
      }
    })
  }

  const handleSaveCode = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/storefront/save-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customHtml,
            customCss,
            customJs,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save custom code")
        }

        const data = await response.json()
        setStorefront(data.storefront)
        toast({
          title: "Custom code saved",
          description: "Your custom code has been saved successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save custom code",
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
        setStorefront(data.storefront)
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

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("THEME")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "THEME"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="inline-block mr-2 h-4 w-4" />
          Designer
        </button>
        <button
          onClick={() => setActiveTab("CUSTOM_CODE")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "CUSTOM_CODE"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code className="inline-block mr-2 h-4 w-4" />
          Custom Code
        </button>
      </div>

      {/* Designer Tab */}
      {activeTab === "THEME" && (
        <Card>
          <CardHeader>
            <CardTitle>Theme Designer</CardTitle>
            <CardDescription>
              Customize your storefront appearance with simple settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeTitle">Store Title</Label>
              <Input
                id="storeTitle"
                value={storeTitle}
                onChange={(e) => setStoreTitle(e.target.value)}
                placeholder="My Store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUpload">Logo</Label>
              
              {logoUrl ? (
                <div className="space-y-2">
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={logoUrl}
                      alt="Store logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById("logoUpload") as HTMLInputElement
                        input?.click()
                      }}
                      disabled={logoUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    key={fileInputKey}
                    ref={fileInputRef}
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById("logoUpload") as HTMLInputElement
                      input?.click()
                    }}
                    disabled={logoUploading}
                    className="w-full"
                  >
                    {logoUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading... {Math.round(logoUploadProgress)}%
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Upload your store logo image (max 5MB)
              </p>
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
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <Button onClick={handleSaveTheme} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Theme"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Code Tab */}
      {activeTab === "CUSTOM_CODE" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Code</CardTitle>
              <CardDescription>
                Write custom HTML, CSS, and JavaScript for your storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customHtml">HTML</Label>
                <Textarea
                  id="customHtml"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  placeholder="<div>Your custom HTML here</div>"
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
                  {customCss.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customJs">JavaScript (Optional)</Label>
                <Textarea
                  id="customJs"
                  value={customJs}
                  onChange={(e) => setCustomJs(e.target.value)}
                  placeholder="// Your custom JavaScript here"
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  {customJs.length} characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveCode} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Code"
                  )}
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isPending || !storefront.customHtml}
                  variant="default"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>

              {storefront.publishedAt && (
                <div className="mt-4">
                  <Badge variant="outline" className="mr-2">
                    Published
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last published: {new Date(storefront.publishedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
