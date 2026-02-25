import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"

export const runtime = "nodejs"

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  fixedFeePaise: z.number().int().min(0).optional(),
  variableFeeBps: z.number().int().min(0).optional(),
  domainPricePaise: z.number().int().min(0).optional(),
  domainAllowed: z.boolean().optional(),
  domainIncluded: z.boolean().optional(),
  payoutFrequency: z.enum(["WEEKLY", "DAILY", "MANUAL"]).optional(),
  holdbackBps: z.number().int().min(0).optional(),
  isPayoutHold: z.boolean().optional(),
  isActive: z.boolean().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).optional(),
  reason: z.string().min(1).optional(),
  features: z
    .array(
      z.object({
        featureId: z.string(),
        enabled: z.boolean(),
        valueJson: z.unknown().optional(),
      })
    )
    .optional(),
})

/** GET /api/admin/pricing-packages/[id] — package with selected features */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { id } = await params
  const pkg = await prisma.pricingPackage.findUnique({
    where: { id, deletedAt: null },
    include: {
      features: {
        include: { feature: true },
      },
    },
  })

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...pkg,
    features: pkg.features.map((pf) => ({
      featureId: pf.featureId,
      featureKey: pf.feature.key,
      featureName: pf.feature.name,
      enabled: pf.enabled,
      valueJson: pf.valueJson,
    })),
  })
}

/** PATCH /api/admin/pricing-packages/[id] — update package + features (DRAFT only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  const { id } = await params
  const existing = await prisma.pricingPackage.findUnique({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 })
  }
  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT packages can be updated" },
      { status: 400 }
    )
  }

  let body: z.infer<typeof updateBodySchema>
  try {
    body = updateBodySchema.parse(await request.json())
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof z.ZodError ? e.flatten() : null },
      { status: 400 }
    )
  }

  const data: Parameters<typeof prisma.pricingPackage.update>[0]["data"] = {}
  if (body.name != null) data.name = body.name
  if (body.code !== undefined && body.code != null) data.code = body.code
  if (body.description !== undefined) data.description = body.description
  if (body.fixedFeePaise != null) data.fixedFeePaise = body.fixedFeePaise
  if (body.variableFeeBps != null) data.variableFeeBps = body.variableFeeBps
  if (body.domainPricePaise != null) data.domainPricePaise = body.domainPricePaise
  if (body.domainAllowed != null) data.domainAllowed = body.domainAllowed
  if (body.domainIncluded != null) data.domainIncluded = body.domainIncluded
  if (body.payoutFrequency != null) data.payoutFrequency = body.payoutFrequency
  if (body.holdbackBps != null) data.holdbackBps = body.holdbackBps
  if (body.isPayoutHold != null) data.isPayoutHold = body.isPayoutHold
  if (body.isActive != null) data.isActive = body.isActive
  if (body.visibility != null) data.visibility = body.visibility

  const pkg = await prisma.pricingPackage.update({
    where: { id },
    data,
  })

  if (body.features !== undefined) {
    for (const f of body.features) {
      await prisma.pricingPackageFeature.upsert({
        where: {
          pricingPackageId_featureId: {
            pricingPackageId: id,
            featureId: f.featureId,
          },
        },
        update: {
          enabled: f.enabled,
          valueJson: f.enabled ? (f.valueJson ?? undefined) : undefined,
        },
        create: {
          pricingPackageId: id,
          featureId: f.featureId,
          enabled: f.enabled,
          valueJson: f.enabled ? (f.valueJson ?? undefined) : undefined,
        },
      })
    }
  }

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_UPDATE",
    entityType: "PricingPackage",
    entityId: id,
    reason: body.reason ?? "Package updated",
    beforeJson: existing,
    afterJson: pkg,
  })

  return NextResponse.json({ package: pkg })
}
