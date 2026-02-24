import { z } from "zod"

/**
 * CANONICAL STOREFRONT CONFIG SCHEMA
 * 
 * This is the single source of truth for storefront configuration.
 * All configs must conform to this shape after normalization.
 * 
 * Expected shape:
 * {
 *   version: 1,
 *   theme: { colors, typography, ui, customCss },
 *   layout: { sections: Section[] },
 *   branding: { logo, favicon, banner, storeDisplayName, tagline, footerCopyright, social },
 *   seo: { metaTitle, metaDescription, metaKeywords, ogImage, twitterCardImage }
 * }
 */

const ColorSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  muted: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
})

const TypographySchema = z.object({
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
  baseFontSize: z.number().min(12).max(24).default(16),
})

const UISchema = z.object({
  borderRadius: z.number().min(0).max(24).default(8),
  buttonStyle: z.enum(["solid", "outline", "gradient"]).default("solid"),
  shadowIntensity: z.enum(["none", "soft", "medium", "strong"]).default("soft"),
  spacingScale: z.enum(["compact", "normal", "spacious"]).default("normal"),
  containerWidth: z.enum(["boxed", "full"]).default("boxed"),
})

const ThemeSchema = z.object({
  colors: ColorSchema,
  typography: TypographySchema,
  ui: UISchema,
  customCss: z.string().optional(),
})

const SectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("hero"),
    order: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    settings: z.object({
      headline: z.string(),
      subheadline: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("text"),
    order: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    settings: z.object({
      title: z.string(),
      body: z.string(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("productGrid"),
    order: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    settings: z.object({
      title: z.string(),
      collection: z.enum(["all", "featured"]),
      limit: z.number().int().min(1).max(48),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("banner"),
    order: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    settings: z.object({
      text: z.string(),
      link: z.string().optional(),
    }),
  }),
])

const LayoutSchema = z.object({
  sections: z.array(SectionSchema),
})

const SocialSchema = z.object({
  instagram: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  youtube: z.string().url().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
})

const BrandingSchema = z.object({
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  storeDisplayName: z.string().min(1),
  tagline: z.string().optional().nullable(),
  footerCopyright: z.string().optional().nullable(),
  social: SocialSchema,
})

const SEOSchema = z.object({
  metaTitle: z.string().max(60).default(""),
  metaDescription: z.string().max(160).default(""),
  metaKeywords: z.string().default(""),
  ogImage: z.string().url().optional().nullable(),
  twitterCardImage: z.string().url().optional().nullable(),
})

export const StorefrontConfigSchema = z.object({
  version: z.literal(1).default(1),
  theme: ThemeSchema,
  layout: LayoutSchema,
  branding: BrandingSchema,
  seo: SEOSchema,
})

export type StorefrontConfig = z.infer<typeof StorefrontConfigSchema>
export type StorefrontSection = z.infer<typeof SectionSchema>
export type StorefrontTheme = z.infer<typeof ThemeSchema>
export type StorefrontBranding = z.infer<typeof BrandingSchema>
export type StorefrontSEO = z.infer<typeof SEOSchema>
