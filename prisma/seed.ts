import { PrismaClient } from "@prisma/client"
import { FEATURE_DEFINITIONS, STARTER_FEATURE_KEYS, GROWTH_FEATURE_KEYS } from "../lib/features/seed-data"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // 1) Upsert all feature definitions (category, isBeta)
  console.log("Upserting features...")
  const keyToId = new Map<string, string>()
  for (const row of FEATURE_DEFINITIONS) {
    const f = await prisma.feature.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        description: row.description,
        category: row.category,
        isActive: true,
        isBeta: row.isBeta,
        valueType: row.valueType,
      },
      create: {
        key: row.key,
        name: row.name,
        description: row.description,
        category: row.category,
        isActive: true,
        isBeta: row.isBeta,
        valueType: row.valueType,
      },
    })
    keyToId.set(row.key, f.id)
  }
  console.log(`  ${FEATURE_DEFINITIONS.length} features upserted`)

  // 2) Upsert Starter package (code: starter)
  let starterPackage = await prisma.pricingPackage.findFirst({
    where: { name: "Starter", deletedAt: null },
  })
  if (!starterPackage) {
    starterPackage = await prisma.pricingPackage.create({
      data: {
        name: "Starter",
        code: "starter",
        description: "Default starter plan for new merchants",
        status: "PUBLISHED",
        fixedFeePaise: 1000,
        variableFeeBps: 100,
        domainPricePaise: 9900,
        domainAllowed: true,
        domainIncluded: false,
        payoutFrequency: "WEEKLY",
        holdbackBps: 0,
        isPayoutHold: false,
        isActive: true,
        visibility: "PUBLIC",
      },
    })
    console.log("Created Starter pricing package:", starterPackage.id)
  } else {
    await prisma.pricingPackage.update({
      where: { id: starterPackage.id },
      data: { code: "starter" },
    })
    console.log("Starter package already exists, updated code")
  }

  // Attach Starter features
  for (const { key, valueJson } of STARTER_FEATURE_KEYS) {
    const featureId = keyToId.get(key)
    if (!featureId) continue
    await prisma.pricingPackageFeature.upsert({
      where: {
        pricingPackageId_featureId: {
          pricingPackageId: starterPackage!.id,
          featureId,
        },
      },
      update: { enabled: true, valueJson: valueJson ?? undefined },
      create: {
        pricingPackageId: starterPackage!.id,
        featureId,
        enabled: true,
        valueJson: valueJson ?? undefined,
      },
    })
  }
  console.log("  Starter package features attached")

  // 3) Upsert Growth package (code: growth)
  let growthPackage = await prisma.pricingPackage.findFirst({
    where: { name: "Growth", deletedAt: null },
  })
  if (!growthPackage) {
    growthPackage = await prisma.pricingPackage.create({
      data: {
        name: "Growth",
        code: "growth",
        description: "Growth plan with more features",
        status: "PUBLISHED",
        fixedFeePaise: 1500,
        variableFeeBps: 80,
        domainPricePaise: 9900,
        domainAllowed: true,
        domainIncluded: false,
        payoutFrequency: "WEEKLY",
        holdbackBps: 0,
        isPayoutHold: false,
        isActive: true,
        visibility: "PUBLIC",
      },
    })
    console.log("Created Growth pricing package:", growthPackage.id)
  } else {
    await prisma.pricingPackage.update({
      where: { id: growthPackage.id },
      data: { code: "growth" },
    })
    console.log("Growth package already exists, updated code")
  }

  for (const { key, valueJson } of GROWTH_FEATURE_KEYS) {
    const featureId = keyToId.get(key)
    if (!featureId) continue
    await prisma.pricingPackageFeature.upsert({
      where: {
        pricingPackageId_featureId: {
          pricingPackageId: growthPackage!.id,
          featureId,
        },
      },
      update: { enabled: true, valueJson: valueJson ?? undefined },
      create: {
        pricingPackageId: growthPackage!.id,
        featureId,
        enabled: true,
        valueJson: valueJson ?? undefined,
      },
    })
  }
  console.log("  Growth package features attached")

  // 4) Default package = Starter
  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: { defaultPricingPackageId: starterPackage!.id },
    create: {
      id: "singleton",
      defaultPricingPackageId: starterPackage!.id,
    },
  })
  console.log("Set Starter as default pricing package")

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
