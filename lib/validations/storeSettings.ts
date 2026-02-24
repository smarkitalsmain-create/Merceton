import { z } from "zod"

// Helper: URL validation
const urlSchema = z.string().url("Must be a valid URL").optional().or(z.literal(""))

// Helper: Email validation
const emailSchema = z.string().email("Must be a valid email").optional().or(z.literal(""))

// Helper: Phone validation (10-15 digits)
const phoneSchema = z
  .string()
  .regex(/^[0-9]{10,15}$/, "Phone number must be 10-15 digits")
  .optional()
  .or(z.literal(""))

// Helper: Hex color validation
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (#RRGGBB)")
  .optional()
  .or(z.literal(""))

// Helper: Pincode validation (6 digits for India)
const pincodeSchema = z
  .string()
  .regex(/^[0-9]{6}$/, "Pincode must be 6 digits")
  .optional()
  .or(z.literal(""))

export const storeSettingsSchema = z.object({
  // Store identity
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  tagline: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),

  // Branding
  logoUrl: urlSchema,
  bannerUrl: urlSchema,
  faviconUrl: urlSchema,
  brandPrimaryColor: hexColorSchema,
  brandSecondaryColor: hexColorSchema,

  // Contact
  supportEmail: emailSchema,
  supportPhone: phoneSchema,
  whatsappNumber: phoneSchema,
  businessAddressLine1: z.string().max(200).optional().or(z.literal("")),
  businessAddressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  pincode: pincodeSchema,

  // Policies (max 10000 chars each)
  returnPolicy: z.string().max(10000).optional().or(z.literal("")),
  refundPolicy: z.string().max(10000).optional().or(z.literal("")),
  shippingPolicy: z.string().max(10000).optional().or(z.literal("")),
  termsAndConditions: z.string().max(10000).optional().or(z.literal("")),
  privacyPolicy: z.string().max(10000).optional().or(z.literal("")),

  // Social & Tracking
  instagramUrl: urlSchema,
  facebookUrl: urlSchema,
  youtubeUrl: urlSchema,
  linkedinUrl: urlSchema,
  twitterUrl: urlSchema,
  googleAnalyticsId: z.string().max(100).optional().or(z.literal("")),
  metaPixelId: z.string().max(100).optional().or(z.literal("")),

  // Operational
  isStoreLive: z.boolean().default(true),
  showOutOfStockProducts: z.boolean().default(true),
  allowGuestCheckout: z.boolean().default(true),
  storeTimezone: z.string().max(100).optional().or(z.literal("")),

  // SEO
  seoTitle: z.string().max(100).optional().or(z.literal("")),
  seoDescription: z.string().max(500).optional().or(z.literal("")),
  ogImageUrl: urlSchema,
})

export type StoreSettingsData = z.infer<typeof storeSettingsSchema>
