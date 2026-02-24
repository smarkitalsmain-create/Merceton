"use client"

import type { ReactNode } from "react"
import Header from "@/components/marketing/Header"
import Footer from "@/components/marketing/Footer"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

