import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { getEffectiveFeatures } from "@/lib/gating/canUse"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"
import type { Prisma } from "@prisma/client"

export const runtime = "nodejs"

const updateOverridesSchema = z.object({
  overrides: z.array(
    z.object({
      featureId: z.string(),
      isEnabled: z.boolean(),
      config: z.record(z.unknown()).optional(),
      reason: z.string().optional(),
    })
  ),
})

/** GET /api/admin/merchants/[merchantId]/features — effective features + overrides */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { merchantId } = await params

  const [overrides, allFeatures, effective] = await Promise.all([
    prisma.merchantFeatureOverride.findMany({
      where: { merchantId },
      include: { feature: true },
    }),
    prisma.feature.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] }),
    getEffectiveFeatures(merchantId),
  ])

  const overrideMap = new Map(overrides.map((o) => [o.featureId, o]))

  const list = allFeatures.map((f) => {
    const resolved = effective.get(f.key as any)
    const override = overrideMap.get(f.id)
    return {
      featureId: f.id,
      featureKey: f.key,
      featureName: f.name,
      category: f.category,
      enabled: resolved?.enabled ?? false,
      source: resolved?.source ?? "default",
      value: resolved?.value ?? null,
      override: override
        ? { mode: override.mode, valueJson: override.valueJson, note: override.note }
        : null,
    }
  })

  return NextResponse.json({ features: list, overrides: overrides })
}

/** PATCH /api/admin/merchants/[merchantId]/features — update overrides (enable/disable) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { merchantId } = await params

  let body: z.infer<typeof updateOverridesSchema>
  try {
    body = updateOverridesSchema.parse(await request.json())
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof z.ZodError ? e.flatten() : null },
      { status: 400 }
    )
  }

  const createdBy = actor.email || actor.userId

  for (const o of body.overrides) {
    if (o.isEnabled) {
      await prisma.merchantFeatureOverride.upsert({
        where: {
          merchantId_featureId: { merchantId, featureId: o.featureId },
        },
        update: {
          mode: o.config ? "OVERRIDE" : "ENABLE",
          valueJson: (o.config ?? undefined) as Prisma.InputJsonValue | undefined,
          note: o.reason ?? undefined,
          createdBy,
        },
        create: {
          merchantId,
          featureId: o.featureId,
          mode: o.config ? "OVERRIDE" : "ENABLE",
          valueJson: (o.config ?? undefined) as Prisma.InputJsonValue | undefined,
          note: o.reason ?? undefined,
          createdBy,
        },
      })
    } else {
      await prisma.merchantFeatureOverride.upsert({
        where: {
          merchantId_featureId: { merchantId, featureId: o.featureId },
        },
        update: { mode: "DISABLE", note: o.reason ?? undefined, createdBy },
        create: {
          merchantId,
          featureId: o.featureId,
          mode: "DISABLE",
          note: o.reason ?? undefined,
          createdBy,
        },
      })
    }
  }

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "MERCHANT_PACKAGE_UPDATE_OVERRIDES",
    entityType: "MerchantFeatureOverride",
    entityId: merchantId,
    reason: "Feature overrides updated",
    afterJson: JSON.parse(JSON.stringify(body.overrides)),
  })

  return NextResponse.json({ success: true })
}
