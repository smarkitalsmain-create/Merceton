/**
 * Environment-based absolute URLs for Merceton (marketing, app, admin).
 *
 * Env (optional; fallbacks apply when unset):
 * - NEXT_PUBLIC_MARKETING_URL — e.g. https://merceton.com or http://localhost:3000
 * - NEXT_PUBLIC_APP_URL — e.g. https://app.merceton.com or http://localhost:3000/app
 * - NEXT_PUBLIC_ADMIN_URL — e.g. https://admin.merceton.com or http://localhost:3000/admin
 */

const DEFAULT_PROD_MARKETING = "https://merceton.com"
const DEFAULT_PROD_APP = "https://app.merceton.com"
const DEFAULT_PROD_ADMIN = "https://admin.merceton.com"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function normalizePath(path?: string): string {
  if (path == null || path === "") return ""
  return path.startsWith("/") ? path : `/${path}`
}

function joinBaseAndPath(base: string, path?: string): string {
  const b = stripTrailingSlash(base)
  const p = normalizePath(path)
  if (!p) return b
  return `${b}${p}`
}

function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production"
}

function devPort(): string {
  return process.env.PORT || "3000"
}

function defaultMarketingBase(): string {
  return `http://localhost:${devPort()}`
}

/** Local dev: app lives under /app (see middleware rewrite). */
function defaultAppBase(): string {
  return `${defaultMarketingBase()}/app`
}

/** Local dev: admin lives under /admin (same host). */
function defaultAdminBase(): string {
  return `${defaultMarketingBase()}/admin`
}

function resolveMarketingBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MARKETING_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  return isProductionBuild() ? DEFAULT_PROD_MARKETING : defaultMarketingBase()
}

function resolveAppBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  return isProductionBuild() ? DEFAULT_PROD_APP : defaultAppBase()
}

function resolveAdminBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  return isProductionBuild() ? DEFAULT_PROD_ADMIN : defaultAdminBase()
}

/** Public marketing site URL (landing pages). */
export function getMarketingUrl(path?: string): string {
  return joinBaseAndPath(resolveMarketingBase(), path)
}

/** Merchant app (dashboard, auth on app subdomain or /app in dev). */
export function getAppUrl(path?: string): string {
  return joinBaseAndPath(resolveAppBase(), path)
}

/** Platform admin backoffice. */
export function getAdminUrl(path?: string): string {
  return joinBaseAndPath(resolveAdminBase(), path)
}

/** Base URL as URL object (e.g. metadataBase). Prefer marketing origin. */
export function getMarketingUrlObject(): URL {
  try {
    return new URL(resolveMarketingBase())
  } catch {
    return new URL(defaultMarketingBase())
  }
}

/** Host (with port on localhost) for inline labels, e.g. `merceton.com` or `localhost:3000`. */
export function getMarketingHostLabel(): string {
  return getMarketingUrlObject().host
}
