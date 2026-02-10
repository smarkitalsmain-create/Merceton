import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create default "Starter" pricing package if it doesn't exist
  const existingStarter = await prisma.pricingPackage.findFirst({
    where: {
      name: "Starter",
      deletedAt: null,
    },
  })

  if (!existingStarter) {
    const starterPackage = await prisma.pricingPackage.create({
      data: {
        name: "Starter",
        description: "Default starter plan for new merchants",
        status: "PUBLISHED",
        fixedFeePaise: 1000, // ₹10
        variableFeeBps: 100, // 1%
        domainPricePaise: 9900, // ₹99
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

    // Set as default in platform settings
    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: {
        defaultPricingPackageId: starterPackage.id,
      },
      create: {
        id: "singleton",
        defaultPricingPackageId: starterPackage.id,
      },
    })

    console.log("Set Starter as default pricing package")
  } else {
    console.log("Starter package already exists")
  }

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
