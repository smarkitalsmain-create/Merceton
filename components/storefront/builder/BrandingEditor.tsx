"use client"

import { useState } from "react"
import { StorefrontBranding, StorefrontSEO } from "@/lib/storefront/core/config/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { uploadImage } from "@/lib/uploads/uploadImage"

interface BrandingEditorProps {
  branding: StorefrontBranding
  seo: StorefrontSEO
  merchantId: string
  onChange: (branding: StorefrontBranding) => void
  onSEOChange: (seo: StorefrontSEO) => void
}

export function BrandingEditor({ branding, seo, merchantId, onChange, onSEOChange }: BrandingEditorProps) {
  // Ensure seo is always defined (defensive check)
  const safeSEO: StorefrontSEO = seo || {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: null,
    twitterCardImage: null,
  }
  const { toast } = useToast()
  const [uploading, setUploading] = useState<string | null>(null)

  const handleImageUpload = async (file: File, field: "logo" | "favicon" | "banner" | "ogImage" | "twitterCardImage") => {
    setUploading(field)
    try {
      // Map field to kind
      const kindMap: Record<string, "logo" | "favicon" | "banner" | "generic"> = {
        logo: "logo",
        favicon: "favicon",
        banner: "banner",
        ogImage: "generic",
        twitterCardImage: "generic",
      }
      const kind = kindMap[field] || "generic"

      const result = await uploadImage(file, kind)

      if (field === "ogImage" || field === "twitterCardImage") {
        onSEOChange({
          ...safeSEO,
          [field === "ogImage" ? "ogImage" : "twitterCardImage"]: result.url,
        })
      } else {
        onChange({
          ...branding,
          [field]: result.url,
        })
      }

      toast({
        title: "Uploaded",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const ImageUploadField = ({
    label,
    field,
    value,
  }: {
    label: string
    field: "logo" | "favicon" | "banner" | "ogImage" | "twitterCardImage"
    value: string | null
  }) => {
    const isSeoField = field === "ogImage" || field === "twitterCardImage"
    const actualValue = isSeoField
      ? (field === "ogImage" ? safeSEO.ogImage : safeSEO.twitterCardImage)
      : value

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {actualValue ? (
          <div className="space-y-2">
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
              <Image src={actualValue} alt={label} fill className="object-contain" />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isSeoField) {
                    onSEOChange({
                      ...safeSEO,
                      [field === "ogImage" ? "ogImage" : "twitterCardImage"]: null,
                    })
                  } else {
                    onChange({
                      ...branding,
                      [field]: null,
                    })
                  }
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleImageUpload(file, field)
                  }
                  input.click()
                }}
                disabled={uploading === field}
              >
                <Upload className="h-4 w-4 mr-1" />
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*"
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleImageUpload(file, field)
              }
              input.click()
            }}
            disabled={uploading === field}
            className="w-full"
          >
            {uploading === field ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {label}
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Upload logo, favicon, and banner images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField label="Logo" field="logo" value={branding.logo ?? null} />
          <ImageUploadField label="Favicon" field="favicon" value={branding.favicon ?? null} />
          <ImageUploadField label="Banner" field="banner" value={branding.banner ?? null} />

          <div className="space-y-2">
            <Label>Store Display Name</Label>
            <Input
              value={branding.storeDisplayName}
              onChange={(e) =>
                onChange({ ...branding, storeDisplayName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={branding.tagline || ""}
              onChange={(e) => onChange({ ...branding, tagline: e.target.value || null })}
              placeholder="Your store tagline"
            />
          </div>

          <div className="space-y-2">
            <Label>Footer Copyright Text</Label>
            <Input
              value={branding.footerCopyright || ""}
              onChange={(e) =>
                onChange({ ...branding, footerCopyright: e.target.value || null })
              }
              placeholder="© 2024 Your Store. All rights reserved."
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                type="url"
                value={branding.social.instagram || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, instagram: e.target.value || null },
                  })
                }
                placeholder="https://instagram.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                type="url"
                value={branding.social.facebook || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, facebook: e.target.value || null },
                  })
                }
                placeholder="https://facebook.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                type="url"
                value={branding.social.linkedin || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, linkedin: e.target.value || null },
                  })
                }
                placeholder="https://linkedin.com/company/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input
                type="url"
                value={branding.social.twitter || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, twitter: e.target.value || null },
                  })
                }
                placeholder="https://twitter.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input
                type="url"
                value={branding.social.youtube || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, youtube: e.target.value || null },
                  })
                }
                placeholder="https://youtube.com/@yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={branding.social.whatsapp || ""}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    social: { ...branding.social, whatsapp: e.target.value || null },
                  })
                }
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>Optimize your storefront for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Title (max 60 chars)</Label>
            <Input
              value={safeSEO.metaTitle || ""}
              onChange={(e) =>
                onSEOChange({
                  ...safeSEO,
                  metaTitle: e.target.value || "",
                })
              }
              maxLength={60}
              placeholder="Your Store - Best Products Online"
            />
            <p className="text-xs text-muted-foreground">
              {safeSEO.metaTitle?.length || 0}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Meta Description (max 160 chars)</Label>
            <Textarea
              value={safeSEO.metaDescription || ""}
              onChange={(e) =>
                onSEOChange({
                  ...safeSEO,
                  metaDescription: e.target.value || "",
                })
              }
              maxLength={160}
              placeholder="Discover amazing products at Your Store..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {safeSEO.metaDescription?.length || 0}/160 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Meta Keywords</Label>
            <Input
              value={safeSEO.metaKeywords || ""}
              onChange={(e) =>
                onSEOChange({
                  ...safeSEO,
                  metaKeywords: e.target.value || "",
                })
              }
              placeholder="products, online store, shopping"
            />
          </div>

          <ImageUploadField label="Open Graph Image" field="ogImage" value={safeSEO.ogImage ?? null} />
          <ImageUploadField label="Twitter Card Image" field="twitterCardImage" value={safeSEO.twitterCardImage ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}
