import type { Metadata } from "next"
import {
  MarketingContentPage,
  MarketingProse,
  MarketingSection,
} from "@/components/marketing/MarketingContentPage"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Merceton support for help with your account, platform issues, or general business queries.",
  robots: { index: true, follow: true },
}

export default function ContactUsPage() {
  return (
    <MarketingContentPage title="Contact Us">
      <MarketingProse>
        <p>
          If you have any questions, support requests, business inquiries, or need assistance
          regarding Merceton, you can reach us using the details below.
        </p>
      </MarketingProse>

      <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
        <dl className="space-y-3 text-sm sm:text-base">
          <div>
            <dt className="font-semibold text-foreground">Business Name</dt>
            <dd className="mt-1 text-foreground/90">Smarkitals Technologies India Private Limited</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Platform Name</dt>
            <dd className="mt-1 text-foreground/90">Merceton</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">GSTIN</dt>
            <dd className="mt-1 text-foreground/90">09ABPCS5355M1ZG</dd>
          </div>
        </dl>
      </div>

      <MarketingSection heading="Registered Office">
        <address className="not-italic whitespace-pre-line text-foreground/90">
          {`9th Floor, A908, Royal Garden,
Delhi Wazirabad Road,
Near Hindon Civil Airport,
Royal Garden Shalimar City, Loni,
Ghaziabad, Uttar Pradesh - 201005, India`}
        </address>
      </MarketingSection>

      <MarketingSection heading="Support Details">
        <ul className="list-none space-y-3 text-foreground/90">
          <li>
            <span className="font-semibold text-foreground">Email: </span>
            <a
              href="mailto:support@merceton.com"
              className="text-primary underline underline-offset-4 hover:text-primary/90"
            >
              support@merceton.com
            </a>
          </li>
          <li>
            <span className="font-semibold text-foreground">Phone: </span>
            <a href="tel:9289109004" className="text-primary underline underline-offset-4 hover:text-primary/90">
              9289109004
            </a>
          </li>
        </ul>
      </MarketingSection>

      <MarketingSection heading="Support Hours">
        <p className="whitespace-pre-line text-foreground/90">
          {`Monday to Saturday
10:00 AM to 6:00 PM IST`}
        </p>
      </MarketingSection>

      <MarketingSection heading="For Assistance Related To">
        <ul className="list-disc space-y-2 pl-6 text-foreground/90">
          <li>account-related queries</li>
          <li>onboarding and merchant support</li>
          <li>technical issues on the platform</li>
          <li>billing or payment-related questions</li>
          <li>policy or compliance-related requests</li>
        </ul>
      </MarketingSection>
    </MarketingContentPage>
  )
}
