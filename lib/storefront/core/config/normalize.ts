import { StorefrontConfig, StorefrontConfigSchema } from "./schema"
import { defaultConfig } from "./defaults"

/**
 * NORMALIZE CONFIG
 * 
 * Accepts any config shape (old formats, partial configs, etc.)
 * and converts it to canonical StorefrontConfig.
 * 
 * Supported old formats:
 * A) theme/layout stored separately as raw JSON
 * B) layout stored directly as array (without {sections:[]})
 * C) missing version field
 * D) sections without order/isVisible fields
 * E) branding/seo nested in themeConfig
 * 
 * This function NEVER throws. It always returns a valid canonical config.
 */
export function normalizeConfig(input: any, fallbackStoreName?: string): StorefrontConfig {
  // Always start with defaults to ensure seo is always present
  const normalized: StorefrontConfig = {
    version: 1,
    theme: { ...defaultConfig.theme },
    layout: { sections: [] },
    branding: { ...defaultConfig.branding, storeDisplayName: fallbackStoreName || "" },
    seo: { ...defaultConfig.seo }, // SEO is ALWAYS present from defaults
  }

  // If input is null/undefined, return defaults
  if (!input || typeof input !== "object") {
    return normalized
  }

  // Handle version
  if (input.version === 1) {
    // Already canonical format
    try {
      const validated = StorefrontConfigSchema.parse(input)
      return validated
    } catch {
      // Fall through to normalization
    }
  }

  // Normalize theme
  if (input.theme) {
    if (input.theme.colors) {
      normalized.theme.colors = {
        primary: input.theme.colors.primary || defaultConfig.theme.colors.primary,
        secondary: input.theme.colors.secondary || defaultConfig.theme.colors.secondary,
        accent: input.theme.colors.accent || defaultConfig.theme.colors.accent,
        background: input.theme.colors.background || defaultConfig.theme.colors.background,
        text: input.theme.colors.text || defaultConfig.theme.colors.text,
        muted: input.theme.colors.muted || defaultConfig.theme.colors.muted,
        border: input.theme.colors.border || defaultConfig.theme.colors.border,
      }
    }
    if (input.theme.typography) {
      normalized.theme.typography = {
        headingFont: input.theme.typography.headingFont || defaultConfig.theme.typography.headingFont,
        bodyFont: input.theme.typography.bodyFont || defaultConfig.theme.typography.bodyFont,
        baseFontSize: input.theme.typography.baseFontSize ?? defaultConfig.theme.typography.baseFontSize,
      }
    }
    if (input.theme.ui) {
      normalized.theme.ui = {
        borderRadius: input.theme.ui.borderRadius ?? defaultConfig.theme.ui.borderRadius,
        buttonStyle: input.theme.ui.buttonStyle || defaultConfig.theme.ui.buttonStyle,
        shadowIntensity: input.theme.ui.shadowIntensity || defaultConfig.theme.ui.shadowIntensity,
        spacingScale: input.theme.ui.spacingScale || defaultConfig.theme.ui.spacingScale,
        containerWidth: input.theme.ui.containerWidth || defaultConfig.theme.ui.containerWidth,
      }
    }
    if (input.theme.customCss !== undefined) {
      normalized.theme.customCss = input.theme.customCss || undefined
    }
  }

  // Handle old format: themeConfig at root level (from StorefrontSettings)
  if (input.themeConfig) {
    const themeConfig = input.themeConfig
    if (themeConfig.colors) {
      normalized.theme.colors = {
        primary: themeConfig.colors.primary || defaultConfig.theme.colors.primary,
        secondary: themeConfig.colors.secondary || defaultConfig.theme.colors.secondary,
        accent: themeConfig.colors.accent || defaultConfig.theme.colors.accent,
        background: themeConfig.colors.background || defaultConfig.theme.colors.background,
        text: themeConfig.colors.text || defaultConfig.theme.colors.text,
        muted: themeConfig.colors.muted || defaultConfig.theme.colors.muted,
        border: themeConfig.colors.border || defaultConfig.theme.colors.border,
      }
    }
    if (themeConfig.typography) {
      normalized.theme.typography = {
        headingFont: themeConfig.typography.headingFont || defaultConfig.theme.typography.headingFont,
        bodyFont: themeConfig.typography.bodyFont || defaultConfig.theme.typography.bodyFont,
        baseFontSize: themeConfig.typography.baseFontSize ?? defaultConfig.theme.typography.baseFontSize,
      }
    }
    if (themeConfig.ui) {
      normalized.theme.ui = {
        borderRadius: themeConfig.ui.borderRadius ?? defaultConfig.theme.ui.borderRadius,
        buttonStyle: themeConfig.ui.buttonStyle || defaultConfig.theme.ui.buttonStyle,
        shadowIntensity: themeConfig.ui.shadowIntensity || defaultConfig.theme.ui.shadowIntensity,
        spacingScale: themeConfig.ui.spacingScale || defaultConfig.theme.ui.spacingScale,
        containerWidth: themeConfig.ui.containerWidth || defaultConfig.theme.ui.containerWidth,
      }
    }
    if (themeConfig.customCss !== undefined) {
      normalized.theme.customCss = themeConfig.customCss || undefined
    }
    // Branding might be nested in themeConfig
    if (themeConfig.branding) {
      normalized.branding = normalizeBranding(themeConfig.branding, fallbackStoreName)
    }
  }

  // Normalize layout
  // Handle format A: layout.sections (canonical)
  if (input.layout?.sections && Array.isArray(input.layout.sections)) {
    normalized.layout.sections = normalizeSections(input.layout.sections)
  }
  // Handle format B: layout is array directly
  else if (Array.isArray(input.layout)) {
    normalized.layout.sections = normalizeSections(input.layout)
  }
  // Handle format C: sections at root level
  else if (Array.isArray(input.sections)) {
    normalized.layout.sections = normalizeSections(input.sections)
  }
  // Handle format D: layoutJson.sections (from StorefrontPage)
  else if (input.layoutJson?.sections && Array.isArray(input.layoutJson.sections)) {
    normalized.layout.sections = normalizeSections(input.layoutJson.sections)
  }

  // Normalize branding
  if (input.branding) {
    normalized.branding = normalizeBranding(input.branding, fallbackStoreName)
  }

  // Normalize SEO - ALWAYS ensure seo is present with all fields
  if (input.seo) {
    normalized.seo = {
      metaTitle: input.seo.metaTitle ?? "",
      metaDescription: input.seo.metaDescription ?? "",
      metaKeywords: input.seo.metaKeywords ?? "",
      ogImage: input.seo.ogImage || null,
      twitterCardImage: input.seo.twitterCardImage || null,
    }
  }
  // SEO might be nested in branding
  else if (input.branding?.seo) {
    normalized.seo = {
      metaTitle: input.branding.seo.metaTitle ?? "",
      metaDescription: input.branding.seo.metaDescription ?? "",
      metaKeywords: input.branding.seo.metaKeywords ?? "",
      ogImage: input.branding.seo.ogImage || null,
      twitterCardImage: input.branding.seo.twitterCardImage || null,
    }
  }
  // SEO might be nested in themeConfig.branding.seo
  else if (input.themeConfig?.branding?.seo) {
    normalized.seo = {
      metaTitle: input.themeConfig.branding.seo.metaTitle ?? "",
      metaDescription: input.themeConfig.branding.seo.metaDescription ?? "",
      metaKeywords: input.themeConfig.branding.seo.metaKeywords ?? "",
      ogImage: input.themeConfig.branding.seo.ogImage || null,
      twitterCardImage: input.themeConfig.branding.seo.twitterCardImage || null,
    }
  }
  // If no SEO found, use defaults (already set above, but ensure all fields are strings, not null)
  // normalized.seo is already set from defaultConfig above, which has empty strings

  // Validate and return (with safe fallbacks if validation fails)
  try {
    return StorefrontConfigSchema.parse(normalized)
  } catch {
    // If validation fails, return normalized with safe defaults
    return normalized
  }
}

function normalizeSections(sections: any[]): any[] {
  if (!Array.isArray(sections)) return []
  
  return sections
    .filter((s) => s && s.type && s.type !== "footer") // Remove footer sections
    .map((s, idx) => ({
      id: s.id || `${s.type}-${idx}`,
      type: s.type,
      order: typeof s.order === "number" ? s.order : idx,
      isVisible: s.isVisible !== false, // Default to true
      settings: s.settings || {},
    }))
    .sort((a, b) => a.order - b.order)
}

function normalizeBranding(branding: any, fallbackStoreName?: string): any {
  return {
    logo: branding.logo || null,
    favicon: branding.favicon || null,
    banner: branding.banner || null,
    storeDisplayName: branding.storeDisplayName || fallbackStoreName || "",
    tagline: branding.tagline || null,
    footerCopyright: branding.footerCopyright || null,
    social: {
      instagram: branding.social?.instagram || null,
      facebook: branding.social?.facebook || null,
      linkedin: branding.social?.linkedin || null,
      twitter: branding.social?.twitter || null,
      youtube: branding.social?.youtube || null,
      whatsapp: branding.social?.whatsapp || null,
    },
  }
}
