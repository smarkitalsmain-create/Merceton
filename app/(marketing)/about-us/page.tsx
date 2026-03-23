import type { Metadata } from "next"
import {
  MarketingContentPage,
  MarketingProse,
  MarketingSection,
} from "@/components/marketing/MarketingContentPage"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Merceton, an e-commerce enablement platform by Smarkitals Technologies India Private Limited.",
  robots: { index: true, follow: true },
}

export default function AboutUsPage() {
  return (
    <MarketingContentPage title="About Us">
      <MarketingProse>
        <p>
          Merceton is an e-commerce enablement platform built to help sellers launch, manage, and
          grow their online business with clarity and control.
        </p>
        <p>
          We are building Merceton for emerging brands, local businesses, independent sellers, and
          growing merchants who want a practical platform to manage their storefront, products,
          orders, payments, and business operations in one place.
        </p>
        <p>
          Our goal is simple: make commerce easier, more accessible, and more scalable for businesses.
        </p>
        <p>
          Whether a merchant is just starting out or looking to streamline day-to-day selling,
          Merceton is designed to offer a reliable and business-friendly foundation for online growth.
        </p>
      </MarketingProse>

      <MarketingSection heading="Who We Are">
        <p>
          Merceton is operated by Smarkitals Technologies India Private Limited, a company
          incorporated in India.
        </p>
      </MarketingSection>

      <MarketingSection heading="What We Offer">
        <p>
          Merceton provides technology solutions to help merchants operate and manage their online
          selling journey, including:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-foreground/90">
          <li>online storefront enablement</li>
          <li>product and catalog management</li>
          <li>order and payment workflow support</li>
          <li>merchant account tools</li>
          <li>business operations support features</li>
        </ul>
      </MarketingSection>

      <MarketingSection heading="Our Approach">
        <p>We believe commerce platforms should not feel complicated or out of reach.</p>
        <p>Merceton is being built with a focus on:</p>
        <ul className="list-disc space-y-2 pl-6 text-foreground/90">
          <li>simplicity for growing businesses</li>
          <li>practical tools for daily operations</li>
          <li>transparent platform experience</li>
          <li>long-term merchant support</li>
        </ul>
      </MarketingSection>
    </MarketingContentPage>
  )
}
