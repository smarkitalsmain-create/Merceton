"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storeSettingsSchema, type StoreSettingsData } from "@/lib/validations/storeSettings"
import { updateMerchantStoreSettings } from "@/app/actions/storeSettings"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/lib/uploads/uploadImage"

interface StoreSettingsFormProps {
  initialData: Awaited<ReturnType<typeof import("@/app/actions/storeSettings").getMerchantStoreSettings>>
}

export function StoreSettingsForm({ initialData }: StoreSettingsFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditMode, setIsEditMode] = useState(false)

  const form = useForm<StoreSettingsData>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: initialData.storeName || "",
      tagline: initialData.tagline || "",
      description: initialData.description || "",
      logoUrl: initialData.logoUrl || "",
      bannerUrl: initialData.bannerUrl || "",
      faviconUrl: initialData.faviconUrl || "",
      brandPrimaryColor: initialData.brandPrimaryColor || "",
      brandSecondaryColor: initialData.brandSecondaryColor || "",
      supportEmail: initialData.supportEmail || "",
      supportPhone: initialData.supportPhone || "",
      whatsappNumber: initialData.whatsappNumber || "",
      businessAddressLine1: initialData.businessAddressLine1 || "",
      businessAddressLine2: initialData.businessAddressLine2 || "",
      city: initialData.city || "",
      state: initialData.state || "",
      pincode: initialData.pincode || "",
      returnPolicy: initialData.returnPolicy || "",
      refundPolicy: initialData.refundPolicy || "",
      shippingPolicy: initialData.shippingPolicy || "",
      termsAndConditions: initialData.termsAndConditions || "",
      privacyPolicy: initialData.privacyPolicy || "",
      instagramUrl: initialData.instagramUrl || "",
      facebookUrl: initialData.facebookUrl || "",
      youtubeUrl: initialData.youtubeUrl || "",
      linkedinUrl: initialData.linkedinUrl || "",
      twitterUrl: initialData.twitterUrl || "",
      googleAnalyticsId: initialData.googleAnalyticsId || "",
      metaPixelId: initialData.metaPixelId || "",
      isStoreLive: initialData.isStoreLive,
      showOutOfStockProducts: initialData.showOutOfStockProducts,
      allowGuestCheckout: initialData.allowGuestCheckout,
      storeTimezone: initialData.storeTimezone || "Asia/Kolkata",
      seoTitle: initialData.seoTitle || "",
      seoDescription: initialData.seoDescription || "",
      ogImageUrl: initialData.ogImageUrl || "",
    },
  })

  const onSubmit = async (data: StoreSettingsData) => {
    startTransition(async () => {
      const result = await updateMerchantStoreSettings(data)
      if (result.success) {
        toast({
          title: "Success",
          description: "Store settings updated successfully",
        })
        setIsEditMode(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update store settings",
          variant: "destructive",
        })
        if (result.fieldErrors) {
          result.fieldErrors.forEach((err: any) => {
            form.setError(err.path[0] as any, { message: err.message })
          })
        }
      }
    })
  }

  const handleImageUpload = async (
    file: File,
    field: "logoUrl" | "bannerUrl" | "faviconUrl" | "ogImageUrl"
  ) => {
    try {
      // Map field to kind
      const kindMap: Record<string, "logo" | "favicon" | "banner" | "generic"> = {
        logoUrl: "logo",
        bannerUrl: "banner",
        faviconUrl: "favicon",
        ogImageUrl: "generic",
      }
      const kind = kindMap[field] || "generic"

      const result = await uploadImage(file, kind)
      form.setValue(field, result.url)
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Store Settings</h2>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setIsEditMode(false)
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="social">Social & SEO</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Identity</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  {...form.register("storeName")}
                  disabled={!isEditMode}
                  placeholder="My Awesome Store"
                />
                {form.formState.errors.storeName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.storeName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  {...form.register("tagline")}
                  disabled={!isEditMode}
                  placeholder="Your store tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  disabled={!isEditMode}
                  placeholder="Tell customers about your store..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Visual identity and colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {form.watch("logoUrl") && (
                    <div className="relative h-20 w-20">
                      <Image
                        src={form.watch("logoUrl") || ""}
                        alt="Logo"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "logoUrl")
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      {form.watch("logoUrl") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("logoUrl", "")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Banner</Label>
                <div className="flex items-center gap-4">
                  {form.watch("bannerUrl") && (
                    <div className="relative h-32 w-full max-w-md">
                      <Image
                        src={form.watch("bannerUrl") || ""}
                        alt="Banner"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "bannerUrl")
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("banner-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      {form.watch("bannerUrl") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("bannerUrl", "")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  {form.watch("faviconUrl") && (
                    <div className="relative h-16 w-16">
                      <Image
                        src={form.watch("faviconUrl") || "/placeholder.png"}
                        alt="Favicon"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/x-icon"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "faviconUrl")
                        }}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("favicon-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      {form.watch("faviconUrl") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("faviconUrl", "")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandPrimaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandPrimaryColor-color"
                      type="color"
                      value={form.watch("brandPrimaryColor") || "#000000"}
                      onChange={(e) => form.setValue("brandPrimaryColor", e.target.value)}
                      disabled={!isEditMode}
                      className="w-20 h-10"
                    />
                    <Input
                      id="brandPrimaryColor"
                      {...form.register("brandPrimaryColor")}
                      disabled={!isEditMode}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandSecondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandSecondaryColor-color"
                      type="color"
                      value={form.watch("brandSecondaryColor") || "#000000"}
                      onChange={(e) => form.setValue("brandSecondaryColor", e.target.value)}
                      disabled={!isEditMode}
                      className="w-20 h-10"
                    />
                    <Input
                      id="brandSecondaryColor"
                      {...form.register("brandSecondaryColor")}
                      disabled={!isEditMode}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    {...form.register("supportEmail")}
                    disabled={!isEditMode}
                    placeholder="support@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    {...form.register("supportPhone")}
                    disabled={!isEditMode}
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  {...form.register("whatsappNumber")}
                  disabled={!isEditMode}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddressLine1">Address Line 1</Label>
                <Input
                  id="businessAddressLine1"
                  {...form.register("businessAddressLine1")}
                  disabled={!isEditMode}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddressLine2">Address Line 2</Label>
                <Input
                  id="businessAddressLine2"
                  {...form.register("businessAddressLine2")}
                  disabled={!isEditMode}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    disabled={!isEditMode}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    disabled={!isEditMode}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    {...form.register("pincode")}
                    disabled={!isEditMode}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Policies</CardTitle>
              <CardDescription>Legal and operational policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Textarea
                  id="returnPolicy"
                  {...form.register("returnPolicy")}
                  disabled={!isEditMode}
                  placeholder="Your return policy..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea
                  id="refundPolicy"
                  {...form.register("refundPolicy")}
                  disabled={!isEditMode}
                  placeholder="Your refund policy..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                <Textarea
                  id="shippingPolicy"
                  {...form.register("shippingPolicy")}
                  disabled={!isEditMode}
                  placeholder="Your shipping policy..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                <Textarea
                  id="termsAndConditions"
                  {...form.register("termsAndConditions")}
                  disabled={!isEditMode}
                  placeholder="Terms and conditions..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea
                  id="privacyPolicy"
                  {...form.register("privacyPolicy")}
                  disabled={!isEditMode}
                  placeholder="Privacy policy..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social & SEO Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media & SEO</CardTitle>
              <CardDescription>Connect your social accounts and optimize for search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    {...form.register("instagramUrl")}
                    disabled={!isEditMode}
                    placeholder="https://instagram.com/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    type="url"
                    {...form.register("facebookUrl")}
                    disabled={!isEditMode}
                    placeholder="https://facebook.com/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    {...form.register("youtubeUrl")}
                    disabled={!isEditMode}
                    placeholder="https://youtube.com/@yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    {...form.register("linkedinUrl")}
                    disabled={!isEditMode}
                    placeholder="https://linkedin.com/company/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter/X URL</Label>
                  <Input
                    id="twitterUrl"
                    type="url"
                    {...form.register("twitterUrl")}
                    disabled={!isEditMode}
                    placeholder="https://twitter.com/yourstore"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  {...form.register("googleAnalyticsId")}
                  disabled={!isEditMode}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  {...form.register("metaPixelId")}
                  disabled={!isEditMode}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  {...form.register("seoTitle")}
                  disabled={!isEditMode}
                  placeholder="Your Store - Best Products Online"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  {...form.register("seoDescription")}
                  disabled={!isEditMode}
                  placeholder="A brief description for search engines..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image</Label>
                <div className="flex items-center gap-4">
                  {form.watch("ogImageUrl") && (
                    <div className="relative h-32 w-32">
                      <Image
                        src={form.watch("ogImageUrl") || ""}
                        alt="OG Image"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "ogImageUrl")
                        }}
                        className="hidden"
                        id="og-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("og-image-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      {form.watch("ogImageUrl") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("ogImageUrl", "")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Operational controls and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isStoreLive">Store Live</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, customers will see a maintenance message
                  </p>
                </div>
                <Switch
                  id="isStoreLive"
                  checked={form.watch("isStoreLive")}
                  onCheckedChange={(checked) => form.setValue("isStoreLive", checked)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showOutOfStockProducts">Show Out of Stock Products</Label>
                  <p className="text-sm text-muted-foreground">
                    Display products even when stock is zero
                  </p>
                </div>
                <Switch
                  id="showOutOfStockProducts"
                  checked={form.watch("showOutOfStockProducts")}
                  onCheckedChange={(checked) => form.setValue("showOutOfStockProducts", checked)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowGuestCheckout">Allow Guest Checkout</Label>
                  <p className="text-sm text-muted-foreground">
                    Let customers checkout without creating an account
                  </p>
                </div>
                <Switch
                  id="allowGuestCheckout"
                  checked={form.watch("allowGuestCheckout")}
                  onCheckedChange={(checked) => form.setValue("allowGuestCheckout", checked)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeTimezone">Store Timezone</Label>
                <Input
                  id="storeTimezone"
                  {...form.register("storeTimezone")}
                  disabled={!isEditMode}
                  placeholder="Asia/Kolkata"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
