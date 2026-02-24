import { z } from "zod"

export const BrandingSchema = z.object({
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  storeDisplayName: z.string().min(1),
  tagline: z.string().optional().nullable(),
  footerCopyright: z.string().optional().nullable(),
  social: z.object({
    instagram: z.string().url().optional().nullable(),
    facebook: z.string().url().optional().nullable(),
    linkedin: z.string().url().optional().nullable(),
    twitter: z.string().url().optional().nullable(),
    youtube: z.string().url().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
  }),
  seo: z.object({
    metaTitle: z.string().max(60).optional().nullable(),
    metaDescription: z.string().max(160).optional().nullable(),
    metaKeywords: z.string().optional().nullable(),
    ogImage: z.string().url().optional().nullable(),
    twitterCardImage: z.string().url().optional().nullable(),
  }),
})

export type Branding = z.infer<typeof BrandingSchema>

export const defaultBranding: Branding = {
  logo: null,
  favicon: null,
  banner: null,
  storeDisplayName: "",
  tagline: null,
  footerCopyright: null,
  social: {
    instagram: null,
    facebook: null,
    linkedin: null,
    twitter: null,
    youtube: null,
    whatsapp: null,
  },
  seo: {
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    ogImage: null,
    twitterCardImage: null,
  },
}
