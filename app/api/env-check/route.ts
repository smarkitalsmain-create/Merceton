import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Env sanity check: exposes db host and pooler status (host only, no credentials).
 * In production returns 404 to avoid leaking config. Use for local/debug only.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 })
  }

  let dbHost: string | null = null
  let usingPooler = false
  let directHost: string | null = null

  try {
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      const u = new URL(dbUrl)
      dbHost = u.hostname
      usingPooler = u.hostname.includes("-pooler")
    }
  } catch {
    // ignore
  }

  try {
    const directUrl = process.env.DIRECT_URL
    if (directUrl) {
      const u = new URL(directUrl)
      directHost = u.hostname
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    dbHost,
    usingPooler,
    directHost,
    NODE_ENV: process.env.NODE_ENV,
  })
}
