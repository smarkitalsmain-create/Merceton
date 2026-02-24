"use server"

import { revalidatePath } from "next/cache"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { storeSettingsSchema, type StoreSettingsData } from "@/lib/validations/storeSettings"

/**
 * Get merchant store settings
 */
export async function getMerchantStoreSettings() {
  const { merchant } = await authorizeRequest()

  const settings = await prisma.merchantStoreSettings.findUnique({
    where: { merchantId: merchant.id },
  })

  // Return with defaults if not found
  return {
    storeName: settings?.storeName || null,
    tagline: settings?.tagline || null,
    description: settings?.description || null,
    logoUrl: settings?.logoUrl || null,
    bannerUrl: settings?.bannerUrl || null,
    faviconUrl: settings?.faviconUrl || null,
    brandPrimaryColor: settings?.brandPrimaryColor || null,
    brandSecondaryColor: settings?.brandSecondaryColor || null,
    supportEmail: settings?.supportEmail || null,
    supportPhone: settings?.supportPhone || null,
    whatsappNumber: settings?.whatsappNumber || null,
    businessAddressLine1: settings?.businessAddressLine1 || null,
    businessAddressLine2: settings?.businessAddressLine2 || null,
    city: settings?.city || null,
    state: settings?.state || null,
    pincode: settings?.pincode || null,
    returnPolicy: settings?.returnPolicy || null,
    refundPolicy: settings?.refundPolicy || null,
    shippingPolicy: settings?.shippingPolicy || null,
    termsAndConditions: settings?.termsAndConditions || null,
    privacyPolicy: settings?.privacyPolicy || null,
    instagramUrl: settings?.instagramUrl || null,
    facebookUrl: settings?.facebookUrl || null,
    youtubeUrl: settings?.youtubeUrl || null,
    linkedinUrl: settings?.linkedinUrl || null,
    twitterUrl: settings?.twitterUrl || null,
    googleAnalyticsId: settings?.googleAnalyticsId || null,
    metaPixelId: settings?.metaPixelId || null,
    isStoreLive: settings?.isStoreLive ?? true,
    showOutOfStockProducts: settings?.showOutOfStockProducts ?? true,
    allowGuestCheckout: settings?.allowGuestCheckout ?? true,
    storeTimezone: settings?.storeTimezone || "Asia/Kolkata",
    seoTitle: settings?.seoTitle || null,
    seoDescription: settings?.seoDescription || null,
    ogImageUrl: settings?.ogImageUrl || null,
  }
}

/**
 * Update merchant store settings
 */
export async function updateMerchantStoreSettings(data: StoreSettingsData) {
  try {
    const { merchant } = await authorizeRequest()

    // Validate data
    const validated = storeSettingsSchema.parse(data)

    // Helper to convert empty strings to null
    const toNull = (val: string | null | undefined) =>
      val === "" || val === undefined ? null : val

    // Upsert settings (create if doesn't exist, update if exists)
    const settings = await prisma.merchantStoreSettings.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        storeName: validated.storeName,
        tagline: toNull(validated.tagline),
        description: toNull(validated.description),
        logoUrl: toNull(validated.logoUrl),
        bannerUrl: toNull(validated.bannerUrl),
        faviconUrl: toNull(validated.faviconUrl),
        brandPrimaryColor: toNull(validated.brandPrimaryColor),
        brandSecondaryColor: toNull(validated.brandSecondaryColor),
        supportEmail: toNull(validated.supportEmail),
        supportPhone: toNull(validated.supportPhone),
        whatsappNumber: toNull(validated.whatsappNumber),
        businessAddressLine1: toNull(validated.businessAddressLine1),
        businessAddressLine2: toNull(validated.businessAddressLine2),
        city: toNull(validated.city),
        state: toNull(validated.state),
        pincode: toNull(validated.pincode),
        returnPolicy: toNull(validated.returnPolicy),
        refundPolicy: toNull(validated.refundPolicy),
        shippingPolicy: toNull(validated.shippingPolicy),
        termsAndConditions: toNull(validated.termsAndConditions),
        privacyPolicy: toNull(validated.privacyPolicy),
        instagramUrl: toNull(validated.instagramUrl),
        facebookUrl: toNull(validated.facebookUrl),
        youtubeUrl: toNull(validated.youtubeUrl),
        linkedinUrl: toNull(validated.linkedinUrl),
        twitterUrl: toNull(validated.twitterUrl),
        googleAnalyticsId: toNull(validated.googleAnalyticsId),
        metaPixelId: toNull(validated.metaPixelId),
        isStoreLive: validated.isStoreLive,
        showOutOfStockProducts: validated.showOutOfStockProducts,
        allowGuestCheckout: validated.allowGuestCheckout,
        storeTimezone: toNull(validated.storeTimezone) || "Asia/Kolkata",
        seoTitle: toNull(validated.seoTitle),
        seoDescription: toNull(validated.seoDescription),
        ogImageUrl: toNull(validated.ogImageUrl),
      },
      update: {
        storeName: validated.storeName,
        tagline: toNull(validated.tagline),
        description: toNull(validated.description),
        logoUrl: toNull(validated.logoUrl),
        bannerUrl: toNull(validated.bannerUrl),
        faviconUrl: toNull(validated.faviconUrl),
        brandPrimaryColor: toNull(validated.brandPrimaryColor),
        brandSecondaryColor: toNull(validated.brandSecondaryColor),
        supportEmail: toNull(validated.supportEmail),
        supportPhone: toNull(validated.supportPhone),
        whatsappNumber: toNull(validated.whatsappNumber),
        businessAddressLine1: toNull(validated.businessAddressLine1),
        businessAddressLine2: toNull(validated.businessAddressLine2),
        city: toNull(validated.city),
        state: toNull(validated.state),
        pincode: toNull(validated.pincode),
        returnPolicy: toNull(validated.returnPolicy),
        refundPolicy: toNull(validated.refundPolicy),
        shippingPolicy: toNull(validated.shippingPolicy),
        termsAndConditions: toNull(validated.termsAndConditions),
        privacyPolicy: toNull(validated.privacyPolicy),
        instagramUrl: toNull(validated.instagramUrl),
        facebookUrl: toNull(validated.facebookUrl),
        youtubeUrl: toNull(validated.youtubeUrl),
        linkedinUrl: toNull(validated.linkedinUrl),
        twitterUrl: toNull(validated.twitterUrl),
        googleAnalyticsId: toNull(validated.googleAnalyticsId),
        metaPixelId: toNull(validated.metaPixelId),
        isStoreLive: validated.isStoreLive,
        showOutOfStockProducts: validated.showOutOfStockProducts,
        allowGuestCheckout: validated.allowGuestCheckout,
        storeTimezone: toNull(validated.storeTimezone) || "Asia/Kolkata",
        seoTitle: toNull(validated.seoTitle),
        seoDescription: toNull(validated.seoDescription),
        ogImageUrl: toNull(validated.ogImageUrl),
      },
    })

    revalidatePath("/dashboard/settings/store")
    revalidatePath(`/s/${merchant.slug}`)

    return { success: true, data: settings }
  } catch (error: any) {
    console.error("Store settings update error:", error)
    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: error.errors,
      }
    }
    return { success: false, error: error.message || "Failed to update store settings" }
  }
}
