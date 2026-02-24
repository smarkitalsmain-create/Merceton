import { ReactNode } from "react"

/**
 * Invoice layout - completely bypasses dashboard layout
 * Returns minimal wrapper without sidebar/header
 */
export default function InvoiceLayout({ children }: { children: ReactNode }) {
  // Return minimal wrapper - root layout already has html/body
  return <>{children}</>
}
