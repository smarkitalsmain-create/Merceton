import { StorefrontTheme } from "./config/schema"

/**
 * Convert theme config to CSS variables
 * Returns a style object that can be applied to the storefront root
 */
export function themeToCssVars(theme: StorefrontTheme): React.CSSProperties {
  const spacing = {
    compact: "0.5rem",
    normal: "1rem",
    spacious: "1.5rem",
  }[theme.ui.spacingScale]

  const shadows = {
    none: "none",
    soft: "0 1px 3px rgba(0,0,0,0.1)",
    medium: "0 4px 6px rgba(0,0,0,0.1)",
    strong: "0 10px 15px rgba(0,0,0,0.2)",
  }[theme.ui.shadowIntensity]

  return {
    "--mt-primary": theme.colors.primary,
    "--mt-secondary": theme.colors.secondary,
    "--mt-accent": theme.colors.accent,
    "--mt-background": theme.colors.background,
    "--mt-text": theme.colors.text,
    "--mt-muted": theme.colors.muted,
    "--mt-border": theme.colors.border,
    "--mt-heading-font": theme.typography.headingFont,
    "--mt-body-font": theme.typography.bodyFont,
    "--mt-base-font-size": `${theme.typography.baseFontSize}px`,
    "--mt-radius": `${theme.ui.borderRadius}px`,
    "--mt-spacing": spacing,
    "--mt-shadow": shadows,
    "--mt-container-width": theme.ui.containerWidth === "full" ? "100%" : "1280px",
  } as React.CSSProperties
}
