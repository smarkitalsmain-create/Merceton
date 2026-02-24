/**
 * Backfill script for existing orders missing orderNumber
 * 
 * This script generates uniform order numbers (ORD-YYMM-000001 format) for orders
 * that don't have an orderNumber assigned.
 * 
 * The script is idempotent: it skips orders that already have an orderNumber.
 * 
 * Usage:
 *   npx tsx scripts/backfillOrderNumbers.ts
 * 
 * Or with ts-node:
 *   npx ts-node scripts/backfillOrderNumbers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MonthKey {
  year: number;
  month: number;
  key: string; // "ORD-2602"
}

/**
 * Generate order number for a given month
 */
async function generateOrderNumberForMonth(
  prisma: PrismaClient,
  date: Date
): Promise<string> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const yy = String(year).slice(-2);
  const mm = String(month).padStart(2, "0");
  const key = `ORD-${yy}${mm}`;

  // Atomic increment using upsert
  const counter = await prisma.$transaction(async (tx) => {
    const updated = await tx.orderNumberCounter.upsert({
      where: { key },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        key,
        value: 1,
      },
      select: {
        value: true,
      },
    });
    return updated;
  });

  return `${key}-${String(counter.value).padStart(6, "0")}`;
}

async function main() {
  console.log("Starting order number backfill...\n");

  // Find all orders missing orderNumber
  const ordersWithoutNumber = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { equals: "" } },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
    },
  });

  if (ordersWithoutNumber.length === 0) {
    console.log("✅ No orders need backfilling. All orders have orderNumber assigned.");
    return;
  }

  console.log(`Found ${ordersWithoutNumber.length} orders without orderNumber.\n`);

  // Group orders by month (YYMM)
  const ordersByMonth = new Map<string, typeof ordersWithoutNumber>();
  
  for (const order of ordersWithoutNumber) {
    const date = order.createdAt;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, "0");
    const monthKey = `${yy}${mm}`;

    if (!ordersByMonth.has(monthKey)) {
      ordersByMonth.set(monthKey, []);
    }
    ordersByMonth.get(monthKey)!.push(order);
  }

  console.log(`Orders grouped into ${ordersByMonth.size} month(s):\n`);
  for (const [monthKey, orders] of Array.from(ordersByMonth.entries())) {
    console.log(`  ${monthKey}: ${orders.length} orders`);
  }
  console.log();

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Process each month
  for (const [monthKey, orders] of Array.from(ordersByMonth.entries())) {
    const [yy, mm] = [monthKey.slice(0, 2), monthKey.slice(2)];
    const year = 2000 + parseInt(yy); // Convert YY to full year (assumes 2000s)
    const month = parseInt(mm);
    const date = new Date(year, month - 1, 1); // First day of the month

    console.log(`Processing month ${monthKey} (${orders.length} orders)...`);

    for (const order of orders) {
      try {
        // Check if orderNumber was already assigned (idempotency check)
        const existing = await prisma.order.findUnique({
          where: { id: order.id },
          select: { orderNumber: true },
        });

        if (existing?.orderNumber && existing.orderNumber.trim() !== "") {
          console.log(`  ⏭️  Skipping ${order.id} - already has orderNumber: ${existing.orderNumber}`);
          totalSkipped++;
          continue;
        }

        // Generate order number for this month
        const orderNumber = await generateOrderNumberForMonth(prisma, order.createdAt);

        // Update order
        await prisma.order.update({
          where: { id: order.id },
          data: { orderNumber },
        });

        console.log(`  ✅ ${order.id} -> ${orderNumber}`);
        totalUpdated++;
      } catch (error: any) {
        console.error(`  ❌ Error processing ${order.id}:`, error.message);
        totalErrors++;
      }
    }

    console.log();
  }

  // Summary
  console.log("=".repeat(50));
  console.log("Backfill Summary:");
  console.log(`  ✅ Updated: ${totalUpdated}`);
  console.log(`  ⏭️  Skipped: ${totalSkipped}`);
  console.log(`  ❌ Errors: ${totalErrors}`);
  console.log(`  📊 Total: ${ordersWithoutNumber.length}`);
  console.log("=".repeat(50));
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
