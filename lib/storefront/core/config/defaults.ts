import { StorefrontConfig } from "./schema"

/**
 * DEFAULT CANONICAL CONFIG
 * Used when no config exists or as fallback during normalization
 */
export const defaultConfig: StorefrontConfig = {
  version: 1,
  theme: {
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
  },
  layout: {
    sections: [],
  },
  branding: {
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
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: null,
    twitterCardImage: null,
  },
}
