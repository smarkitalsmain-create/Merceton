/**
 * Repair script for duplicate orderNumber values
 * 
 * This script regenerates order numbers sequentially to ensure uniqueness.
 * It processes all orders sorted by createdAt and assigns new order numbers
 * using the proper ORD-YYMM-000001 format, resetting sequence per month.
 * 
 * The script is idempotent and safely overwrites existing duplicates.
 * 
 * Usage:
 *   npx tsx scripts/repairOrderNumbers.ts
 * 
 * Or with ts-node:
 *   npx ts-node scripts/repairOrderNumbers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate order number for a specific month
 * Uses the same logic as generateOrderNumber but ensures sequential assignment
 */
function generateSequentialOrderNumber(
  prisma: PrismaClient,
  date: Date,
  currentSeq: number
): { orderNumber: string; nextSeq: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const yy = String(year).slice(-2); // Last 2 digits of year
  const mm = String(month).padStart(2, "0"); // 2-digit month
  const key = `ORD-${yy}${mm}`;

  // Increment sequence for this month
  const nextSeq = currentSeq + 1;

  // Format: ORD-YYMM-000001 (6-digit sequence)
  const orderNumber = `${key}-${String(nextSeq).padStart(6, "0")}`;

  return { orderNumber, nextSeq };
}

/**
 * Update OrderNumberCounter table to reflect the highest sequence used
 */
async function updateOrderCounter(
  prisma: PrismaClient,
  key: string,
  value: number
): Promise<void> {
  await prisma.orderNumberCounter.upsert({
    where: { key },
    update: {
      value: Math.max(value, 0), // Ensure non-negative
    },
    create: {
      key,
      value: Math.max(value, 0),
    },
  });
}

async function main() {
  console.log("Starting order number repair...\n");

  // Fetch all orders sorted by createdAt ascending
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
    },
  });

  if (orders.length === 0) {
    console.log("✅ No orders found. Nothing to repair.");
    return;
  }

  console.log(`Found ${orders.length} orders to process.\n`);

  // Track sequences per month (YYMM)
  const monthSequences = new Map<string, number>();

  // Track duplicates found
  const seenOrderNumbers = new Set<string>();
  let duplicatesFound = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Process each order
  for (const order of orders) {
    try {
      totalProcessed++;

      const date = order.createdAt;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yy = String(year).slice(-2);
      const mm = String(month).padStart(2, "0");
      const monthKey = `${yy}${mm}`;

      // Get or initialize sequence for this month
      let currentSeq = monthSequences.get(monthKey) || 0;

      // Check if current orderNumber is a duplicate
      let needsUpdate = false;
      let newOrderNumber: string = ""; // Initialize to avoid "used before assigned"

      if (!order.orderNumber || order.orderNumber.trim() === "") {
        // Missing orderNumber - generate new one
        needsUpdate = true;
        const result = generateSequentialOrderNumber(prisma, date, currentSeq);
        newOrderNumber = result.orderNumber;
        currentSeq = result.nextSeq;
      } else if (seenOrderNumbers.has(order.orderNumber)) {
        // Duplicate found - regenerate
        duplicatesFound++;
        needsUpdate = true;
        const result = generateSequentialOrderNumber(prisma, date, currentSeq);
        newOrderNumber = result.orderNumber;
        currentSeq = result.nextSeq;
        console.log(`  🔄 Duplicate found: ${order.id} (old: ${order.orderNumber}) -> ${newOrderNumber}`);
      } else {
        // Valid unique orderNumber - check if it follows the format
        const orderNumberMatch = order.orderNumber.match(/^ORD-(\d{2})(\d{2})-(\d+)$/);
        if (orderNumberMatch) {
          const [, orderYY, orderMM, orderSeq] = orderNumberMatch;
          const orderMonthKey = `${orderYY}${orderMM}`;

          // If it's for the current month, update sequence to be at least this value
          if (orderMonthKey === monthKey) {
            const seqNum = parseInt(orderSeq, 10);
            if (seqNum > currentSeq) {
              currentSeq = seqNum;
            }
          }

          // Mark as seen and skip update
          seenOrderNumbers.add(order.orderNumber);
          totalSkipped++;
          if (totalProcessed % 100 === 0 || totalProcessed <= 10) {
            console.log(`  ✅ ${order.id} - ${order.orderNumber} (valid, skipping)`);
          }
        } else {
          // Invalid format - regenerate
          needsUpdate = true;
          const result = generateSequentialOrderNumber(prisma, date, currentSeq);
          newOrderNumber = result.orderNumber;
          currentSeq = result.nextSeq;
          console.log(`  🔄 Invalid format: ${order.id} (old: ${order.orderNumber}) -> ${newOrderNumber}`);
        }
      }

      // Update order if needed
      if (needsUpdate) {
        await prisma.order.update({
          where: { id: order.id },
          data: { orderNumber: newOrderNumber },
        });

        // Mark as seen
        seenOrderNumbers.add(newOrderNumber);

        // Update sequence tracker
        monthSequences.set(monthKey, currentSeq);

        // Update OrderCounter table
        const counterKey = `ORD-${monthKey}`;
        await updateOrderCounter(prisma, counterKey, currentSeq);

        totalUpdated++;
        console.log(`  ✅ ${order.id} -> ${newOrderNumber}`);
      }
    } catch (error: any) {
      totalErrors++;
      console.error(`  ❌ Error processing ${order.id}:`, error.message);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Repair Summary:");
  console.log(`  📊 Total processed: ${totalProcessed}`);
  console.log(`  ✅ Updated: ${totalUpdated}`);
  console.log(`  ⏭️  Skipped (valid): ${totalSkipped}`);
  console.log(`  🔄 Duplicates fixed: ${duplicatesFound}`);
  console.log(`  ❌ Errors: ${totalErrors}`);
  console.log("\n  Month sequences updated:");
  for (const [monthKey, seq] of Array.from(monthSequences.entries())) {
    console.log(`    ${monthKey}: ${seq}`);
  }
  console.log("=".repeat(50));

  if (duplicatesFound > 0 || totalUpdated > 0) {
    console.log("\n✅ Order numbers repaired successfully!");
    console.log("Next step: Re-add @unique constraint to orderNumber in schema.prisma");
    console.log("Then run: npx prisma migrate dev --name enforce_order_number_unique");
  } else {
    console.log("\n✅ No duplicates found. All order numbers are unique.");
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
