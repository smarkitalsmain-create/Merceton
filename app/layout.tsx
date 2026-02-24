import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getBaseUrl } from "@/lib/site"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: {
    default: "Merceton",
    template: "Merceton | %s",
  },
  description:
    "Merceton is an India-first ecommerce enablement platform to launch and grow your online storefront.",
  openGraph: {
    title: "Merceton",
    description:
      "Merceton is an India-first ecommerce enablement platform to launch and grow your online storefront.",
    type: "website",
    siteName: "Merceton",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merceton",
    description:
      "Merceton is an India-first ecommerce enablement platform to launch and grow your online storefront.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
