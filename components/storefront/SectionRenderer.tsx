"use client"

import { StorefrontSection } from "@/lib/storefront/core/config/schema"
import { HeroSection } from "./sections/HeroSection"
import { TextSection } from "./sections/TextSection"
import { ProductGridSection } from "./sections/ProductGridSection"
import { BannerSection } from "./sections/BannerSection"

interface SectionRendererProps {
  sections: StorefrontSection[]
  storeSlug: string
  products: Array<{
    id: string
    name: string
    description: string | null
    price: number
    mrp: number | null
    stock: number
    images: Array<{ url: string; alt: string | null }>
  }>
}

export function SectionRenderer({ sections, storeSlug, products }: SectionRendererProps) {
  // Filter visible sections and sort by order (footer type doesn't exist in union, skip check)
  const visibleSections = sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <HeroSection
                key={section.id}
                headline={section.settings.headline}
                subheadline={section.settings.subheadline}
                ctaText={section.settings.ctaText}
                ctaLink={section.settings.ctaLink}
              />
            )
          case "text":
            return (
              <TextSection
                key={section.id}
                title={section.settings.title}
                body={section.settings.body}
              />
            )
          case "productGrid": {
            const limitedProducts = products.slice(0, section.settings.limit)
            if (limitedProducts.length === 0) return null
            return (
              <ProductGridSection
                key={section.id}
                storeSlug={storeSlug}
                title={section.settings.title}
                products={limitedProducts}
              />
            )
          }
          case "banner":
            return (
              <BannerSection
                key={section.id}
                text={section.settings.text}
                link={section.settings.link}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
