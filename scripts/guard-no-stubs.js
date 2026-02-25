#!/usr/bin/env node
/**
 * Guardrail: fail if app/api or app/actions contain stub phrases that must not ship.
 * Run as: node scripts/guard-no-stubs.js
 * Use in prepush or CI.
 */
const fs = require("fs")
const path = require("path")

const ROOTS = ["app/api", "app/actions"]
const FORBIDDEN = [
  "Not implemented yet",
  '"Not implemented yet"',
  "'Not implemented yet'",
  "Not implemented",
  "throw new Error('Not implemented",
  'throw new Error("Not implemented',
  "console.warn('Not implemented",
  'console.warn("Not implemented',
]

function* walk(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue
      yield* walk(full)
    } else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
      yield full
    }
  }
}

const hits = []
for (const root of ROOTS) {
  const abs = path.join(process.cwd(), root)
  for (const file of walk(abs)) {
    const content = fs.readFileSync(file, "utf8")
    for (const phrase of FORBIDDEN) {
      if (content.includes(phrase)) {
        hits.push({ file: path.relative(process.cwd(), file), phrase })
      }
    }
  }
}

if (hits.length > 0) {
  console.error("guard-no-stubs: forbidden stub phrases found. Do not ship these.")
  for (const { file, phrase } of hits) {
    console.error(`  ${file}: "${phrase}"`)
  }
  process.exit(1)
}

console.log("guard-no-stubs: no forbidden stub phrases in app/api or app/actions.")
process.exit(0)
