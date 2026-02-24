import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

/**
 * Get platform billing profile (singleton)
 * Creates default if missing
 */
export async function getPlatformBillingProfile() {
  let profile = await prisma.platformBillingProfile.findUnique({
    where: { id: "platform" },
  })

  if (!profile) {
    // Create default profile
    profile = await prisma.platformBillingProfile.create({
      data: {
        id: "platform",
        legalName: "Smarkitals Technologies India Pvt Ltd",
        invoicePrefix: "SMK",
        invoiceNextNumber: 1,
        invoicePadding: 5,
        seriesFormat: "{PREFIX}-{FY}-{NNNNN}",
        defaultSacCode: "9983",
        defaultGstRate: new Decimal(18),
      },
    })
  }

  return profile
}

/**
 * Get merchant's platform invoice for a specific settlement cycle
 */
export async function getMerchantPlatformInvoiceForCycle(
  merchantId: string,
  cycleId: string
) {
  const invoice = await prisma.platformInvoice.findFirst({
    where: {
      merchantId,
      cycleId,
    },
    include: {
      lineItems: {
        orderBy: {
          createdAt: "asc",
        },
      },
      cycle: true,
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          onboarding: {
            select: {
              invoiceEmail: true,
              invoicePhone: true,
              invoiceAddressLine1: true,
              invoiceAddressLine2: true,
              invoiceCity: true,
              invoiceState: true,
              invoicePincode: true,
            },
          },
        },
      },
    },
  })

  return invoice
}

/**
 * List all platform invoices for a settlement cycle (admin view)
 * Grouped by merchant
 */
export async function listAdminPlatformInvoicesForCycle(cycleId: string) {
  const invoices = await prisma.platformInvoice.findMany({
    where: {
      cycleId,
    },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      lineItems: true,
      cycle: true,
    },
    orderBy: {
      invoiceDate: "desc",
    },
  })

  return invoices
}

/**
 * List merchant's payout cycles with invoices
 * Returns cycles where merchant has invoices or payouts
 */
export async function listMerchantPayoutCyclesWithInvoice(merchantId: string) {
  // Get cycles where merchant has invoices
  const invoices = await prisma.platformInvoice.findMany({
    where: {
      merchantId,
    },
    include: {
      cycle: true,
      lineItems: true,
    },
    orderBy: {
      invoiceDate: "desc",
    },
    take: 50,
  })

  // Also get cycles where merchant has payouts
  const payouts = await prisma.payoutBatch.findMany({
    where: {
      merchantId,
      cycleId: { not: null },
    },
    include: {
      platformInvoice: {
        include: {
          cycle: true,
          lineItems: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  })

  // Combine and deduplicate by cycleId
  type CycleType = typeof invoices[0]["cycle"]
  const cycleMap = new Map<string, {
    cycle: CycleType | null
    invoice: typeof invoices[0] | null
    payout: typeof payouts[0] | null
  }>()

  invoices.forEach((inv) => {
    if (!cycleMap.has(inv.cycleId)) {
      cycleMap.set(inv.cycleId, {
        cycle: inv.cycle,
        invoice: inv,
        payout: null,
      })
    } else {
      const entry = cycleMap.get(inv.cycleId)!
      entry.invoice = inv
    }
  })

  payouts.forEach((payout) => {
    if (payout.cycleId) {
      if (!cycleMap.has(payout.cycleId)) {
        const cycle = payout.platformInvoice?.cycle ?? null
        cycleMap.set(payout.cycleId, {
          cycle: cycle,
          invoice: payout.platformInvoice || null,
          payout,
        })
      } else {
        const entry = cycleMap.get(payout.cycleId)!
        entry.payout = payout
        if (payout.platformInvoice) {
          entry.invoice = payout.platformInvoice
        }
      }
    }
  })

  return Array.from(cycleMap.values())
}

/**
 * Get platform invoice by ID with full details
 */
export async function getPlatformInvoiceById(invoiceId: string) {
  const invoice = await prisma.platformInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: {
        orderBy: {
          createdAt: "asc",
        },
      },
      cycle: true,
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          onboarding: {
            select: {
              invoiceEmail: true,
              invoicePhone: true,
              invoiceAddressLine1: true,
              invoiceAddressLine2: true,
              invoiceCity: true,
              invoiceState: true,
              invoicePincode: true,
            },
          },
        },
      },
    },
  })

  return invoice
}

/**
 * List all platform invoices for admin (all merchants)
 */
export async function listAllPlatformInvoices(limit = 100) {
  const invoices = await prisma.platformInvoice.findMany({
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      cycle: true,
      lineItems: true,
    },
    orderBy: {
      invoiceDate: "desc",
    },
    take: limit,
  })

  return invoices
}

/**
 * List merchant's platform invoices
 */
export async function listMerchantPlatformInvoices(merchantId: string, limit = 50) {
  const invoices = await prisma.platformInvoice.findMany({
    where: {
      merchantId,
    },
    include: {
      cycle: true,
      lineItems: true,
    },
    orderBy: {
      invoiceDate: "desc",
    },
    take: limit,
  })

  return invoices
}
