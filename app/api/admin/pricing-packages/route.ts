import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/audit"
import { z } from "zod"

export const runtime = "nodejs"

const createBodySchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  fixedFeePaise: z.number().int().min(0),
  variableFeeBps: z.number().int().min(0),
  domainPricePaise: z.number().int().min(0).default(9900),
  domainAllowed: z.boolean().default(true),
  domainIncluded: z.boolean().default(false),
  payoutFrequency: z.enum(["WEEKLY", "DAILY", "MANUAL"]).default("WEEKLY"),
  holdbackBps: z.number().int().min(0).default(0),
  isPayoutHold: z.boolean().default(false),
  isActive: z.boolean().default(true),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).default("PUBLIC"),
  reason: z.string().min(1),
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

/** POST /api/admin/pricing-packages — create package + selected features */
export async function POST(request: NextRequest) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  let body: z.infer<typeof createBodySchema>
  try {
    body = createBodySchema.parse(await request.json())
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof z.ZodError ? e.flatten() : null },
      { status: 400 }
    )
  }

  const pkg = await prisma.pricingPackage.create({
    data: {
      name: body.name,
      code:
        body.code?.trim() ||
        (body.name
          ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now()
          : "pkg-" + Date.now()),
      description: body.description ?? null,
      status: "DRAFT",
      fixedFeePaise: body.fixedFeePaise,
      variableFeeBps: body.variableFeeBps,
      domainPricePaise: body.domainPricePaise,
      domainAllowed: body.domainAllowed,
      domainIncluded: body.domainIncluded,
      payoutFrequency: body.payoutFrequency,
      holdbackBps: body.holdbackBps,
      isPayoutHold: body.isPayoutHold,
      isActive: body.isActive,
      visibility: body.visibility,
    },
  })

  if (body.features?.length) {
    for (const f of body.features) {
      if (!f.enabled) continue
      await prisma.pricingPackageFeature.upsert({
        where: {
          pricingPackageId_featureId: {
            pricingPackageId: pkg.id,
            featureId: f.featureId,
          },
        },
        update: { enabled: true, valueJson: f.valueJson ?? undefined },
        create: {
          pricingPackageId: pkg.id,
          featureId: f.featureId,
          enabled: true,
          valueJson: f.valueJson ?? undefined,
        },
      })
    }
  }

  await logAdminAction({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actionType: "PRICING_PACKAGE_CREATE",
    entityType: "PricingPackage",
    entityId: pkg.id,
    reason: body.reason,
    afterJson: pkg,
  })

  return NextResponse.json({ package: pkg })
}
