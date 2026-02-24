#!/usr/bin/env tsx
/**
 * System Deep Smoke
 *
 * Runs Vitest unit/integration tests and Playwright E2E tests
 * as a single command for CI or local validation.
 */

import { spawn } from "node:child_process"

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: process.env,
    })

    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`))
    })
  })
}

async function main() {
  try {
    console.log("\n=== Running unit/integration tests (Vitest) ===\n")
    await run("npx", ["vitest", "run"])

    console.log("\n=== Running E2E tests (Playwright) ===\n")
    await run("npx", ["playwright", "test"])

    console.log("\n✅ Deep smoke tests passed\n")
    process.exit(0)
  } catch (error) {
    console.error("\n❌ Deep smoke tests failed\n", error)
    process.exit(1)
  }
}

void main()

