import { z } from "zod"
import { ThemeSchema, defaultTheme, type Theme } from "./theme-schema"
import { BrandingSchema, defaultBranding } from "./branding-schema"

// Re-export Theme type for convenience
export type { Theme }

// Section schema (without footer)
const SectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("hero"),
    order: z.number(),
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
    order: z.number(),
    isVisible: z.boolean().default(true),
    settings: z.object({
      title: z.string(),
      body: z.string(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("productGrid"),
    order: z.number(),
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
    order: z.number(),
    isVisible: z.boolean().default(true),
    settings: z.object({
      text: z.string(),
      link: z.string().optional(),
    }),
  }),
])

export const StorefrontConfigSchema = z.object({
  theme: ThemeSchema,
  layout: z.array(SectionSchema),
  branding: BrandingSchema,
})

export type StorefrontConfig = z.infer<typeof StorefrontConfigSchema>
export type StorefrontSection = z.infer<typeof SectionSchema>

export const defaultConfig: StorefrontConfig = {
  theme: defaultTheme,
  layout: [],
  branding: defaultBranding,
}
