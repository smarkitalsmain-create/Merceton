/**
 * Ensures the features table is populated with canonical definitions.
 * Safe to call on every request when table is empty; use sparingly (e.g. when GET /api/admin/features returns empty).
 */

import { prisma } from "@/lib/prisma"
import { FEATURE_DEFINITIONS } from "./seed-data"

export async function ensureFeaturesSeeded(): Promise<{ seeded: number }> {
  const existing = await prisma.feature.count()
  if (existing > 0) return { seeded: 0 }

  let seeded = 0
  for (const row of FEATURE_DEFINITIONS) {
    await prisma.feature.upsert({
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
    seeded++
  }
  return { seeded }
}
