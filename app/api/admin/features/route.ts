import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { ensureFeaturesSeeded } from "@/lib/features/ensure-seeded"
import { GROWTH_FEATURE_KEYS_LIST } from "@/lib/features/featureKeys"

export const runtime = "nodejs"

/** GET /api/admin/features — only 9 Growth features, grouped by category. Always valid JSON. */
export async function GET() {
  try {
    const actor = await requireAdminForApi()
    if (actor instanceof NextResponse) return actor

    let features = await prisma.feature.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    })

    if (features.length === 0) {
      await ensureFeaturesSeeded()
      features = await prisma.feature.findMany({
        orderBy: [{ category: "asc" }, { key: "asc" }],
      })
    }

    const canonical = features.filter((f) => GROWTH_FEATURE_KEYS_LIST.includes(f.key as any))
    const grouped = canonical.reduce<Record<string, typeof features>>((acc, f) => {
      const cat = f.category ?? "other"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(f)
      return acc
    }, {})

    return NextResponse.json({ grouped })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load features"
    return NextResponse.json(
      { grouped: {} as Record<string, unknown[]>, error: message },
      { status: 500 }
    )
  }
}
