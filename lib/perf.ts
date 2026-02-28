/**
 * Lightweight performance logging for server routes and data loaders.
 * Use console.time/timeEnd for consistency; only logs when NODE_ENV is development
 * or when NEXT_PUBLIC_LOG_PERF is set.
 */

const enabled =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_LOG_PERF === "true"

export function timeStart(label: string): void {
  if (enabled) console.time(label)
}

export function timeEnd(label: string): void {
  if (enabled) console.timeEnd(label)
}

export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  timeStart(label)
  try {
    return await fn()
  } finally {
    timeEnd(label)
  }
}
