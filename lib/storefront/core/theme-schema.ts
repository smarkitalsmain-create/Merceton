import { z } from "zod"

export const ThemeSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    muted: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    baseFontSize: z.number().min(12).max(24).default(16),
  }),
  ui: z.object({
    borderRadius: z.number().min(0).max(24).default(8),
    buttonStyle: z.enum(["solid", "outline", "gradient"]).default("solid"),
    shadowIntensity: z.enum(["none", "soft", "medium", "strong"]).default("soft"),
    spacingScale: z.enum(["compact", "normal", "spacious"]).default("normal"),
    containerWidth: z.enum(["boxed", "full"]).default("boxed"),
  }),
  customCss: z.string().optional(),
})

export type Theme = z.infer<typeof ThemeSchema>

export const defaultTheme: Theme = {
  colors: {
    primary: "#2563EB",
    secondary: "#64748B",
    accent: "#0F172A",
    background: "#F8FAFC",
    text: "#0F172A",
    muted: "#94A3B8",
    border: "#E2E8F0",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseFontSize: 16,
  },
  ui: {
    borderRadius: 8,
    buttonStyle: "solid",
    shadowIntensity: "soft",
    spacingScale: "normal",
    containerWidth: "boxed",
  },
}
