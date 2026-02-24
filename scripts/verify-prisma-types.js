#!/usr/bin/env node

/**
 * Verify Prisma Client Types
 * 
 * Checks if the generated Prisma client includes the invoice fields
 * in MerchantOnboardingCreateInput and MerchantOnboardingUpdateInput
 * 
 * Usage: node scripts/verify-prisma-types.js
 */

const fs = require("fs")
const path = require("path")

const prismaClientPath = path.join(process.cwd(), "node_modules", "@prisma", "client", "index.d.ts")

console.log("🔍 Verifying Prisma Client types...")
console.log("📁 Checking:", prismaClientPath)

if (!fs.existsSync(prismaClientPath)) {
  console.error("❌ Prisma client not found!")
  console.error("   Run: npm run prisma:generate")
  process.exit(1)
}

const typeDefinitions = fs.readFileSync(prismaClientPath, "utf8")

// Required invoice fields
const requiredFields = [
  "invoiceAddressLine1",
  "invoiceCity",
  "invoicePincode",
  "invoiceState",
]

// Optional invoice fields
const optionalFields = [
  "invoiceAddressLine2",
  "invoicePhone",
  "invoiceEmail",
  "invoicePrefix",
]

const allFields = [...requiredFields, ...optionalFields]

// Check MerchantOnboardingCreateInput
const createInputMatch = typeDefinitions.match(/export type MerchantOnboardingCreateInput[^}]*\{[^}]*\}/s)
const updateInputMatch = typeDefinitions.match(/export type MerchantOnboardingUpdateInput[^}]*\{[^}]*\}/s)

let allPassed = true

console.log("\n📋 Checking MerchantOnboardingCreateInput...")
if (createInputMatch) {
  const createInput = createInputMatch[0]
  for (const field of allFields) {
    if (createInput.includes(field)) {
      console.log(`   ✅ ${field}`)
    } else {
      console.log(`   ❌ ${field} - MISSING`)
      allPassed = false
    }
  }
} else {
  console.error("   ❌ MerchantOnboardingCreateInput type not found")
  allPassed = false
}

console.log("\n📋 Checking MerchantOnboardingUpdateInput...")
if (updateInputMatch) {
  const updateInput = updateInputMatch[0]
  for (const field of allFields) {
    if (updateInput.includes(field)) {
      console.log(`   ✅ ${field}`)
    } else {
      console.log(`   ❌ ${field} - MISSING`)
      allPassed = false
    }
  }
} else {
  console.error("   ❌ MerchantOnboardingUpdateInput type not found")
  allPassed = false
}

if (allPassed) {
  console.log("\n✅ All invoice fields are present in Prisma Client types!")
  console.log("   The Prisma client is up-to-date with schema.prisma")
  process.exit(0)
} else {
  console.error("\n❌ Some invoice fields are missing from Prisma Client types!")
  console.error("   Run: npm run prisma:generate")
  console.error("   Then restart your dev server: npm run dev")
  process.exit(1)
}
