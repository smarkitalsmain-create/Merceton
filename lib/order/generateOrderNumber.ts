import { PrismaClient } from "@prisma/client";

/**
 * Generate a uniform, human-readable order number
 * Format: ORD-YYMM-000001
 * 
 * Prefix: "ORD" (fixed)
 * YYMM: Year (2 digits) + Month (2 digits) from date
 * Sequence: 6-digit padded sequence number, incremented atomically per month
 * 
 * This function is concurrency-safe using Prisma transactions.
 * 
 * @param prisma - Prisma client instance
 * @param date - Date to use for YYMM calculation (defaults to current date)
 * @returns Promise<string> - Generated order number (e.g., "ORD-2602-000001")
 */
export async function generateOrderNumber(
  prisma: PrismaClient,
  date: Date = new Date()
): Promise<string> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const yy = String(year).slice(-2); // Last 2 digits of year
  const mm = String(month).padStart(2, "0"); // 2-digit month
  const key = `ORD-${yy}${mm}`;

  // DEV-only: Log order number generation
  if (process.env.NODE_ENV === "development") {
    console.log("[generateOrderNumber] Generating for key:", key)
    // Sanity check: verify delegate exists
    console.log("[generateOrderNumber] Counter delegate exists:", !!prisma.orderNumberCounter)
    console.log("[generateOrderNumber] Available models:", Object.keys(prisma).filter(k => typeof (prisma as any)[k]?.findMany === "function").sort().join(", "))
  }

  // Atomic increment using upsert in transaction
  let counter;
  try {
    counter = await prisma.$transaction(async (tx) => {
      // Upsert counter: create if doesn't exist, increment if exists
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
    }, {
      timeout: 5000, // 5 second timeout for counter update
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[generateOrderNumber] Counter updated:", { key, value: counter.value })
    }
  } catch (error) {
    console.error("[generateOrderNumber] Failed to update counter:", error)
    throw new Error(`Failed to generate order number: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Format: ORD-YYMM-000001 (6-digit sequence)
  const orderNumber = `${key}-${String(counter.value).padStart(6, "0")}`;

  if (process.env.NODE_ENV === "development") {
    console.log("[generateOrderNumber] Generated order number:", orderNumber)
  }

  return orderNumber;
}
