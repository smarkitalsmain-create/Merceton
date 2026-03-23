import Link from "next/link"

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund & Cancellation Policy", href: "/refund-cancellation-policy" },
  { label: "Shipping & Delivery Policy", href: "/shipping-delivery-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Merchant Agreement", href: "/merchant-agreement" },
]

const Footer = () => (
  <footer className="border-t border-border bg-muted/50 py-12">
    <div className="container">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 text-base font-bold text-foreground">Merceton</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A product of Smarkitals Technologies India Pvt Ltd
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="/about-us"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact-us"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Mon – Fri, 10:00 AM – 7:00 PM IST</li>
            <li>
              Email:{" "}
              <a href="mailto:support@merceton.com" className="text-primary hover:underline">
                support@merceton.com
              </a>
            </li>
            <li>
              Grievance:{" "}
              <a href="mailto:info@merceton.com" className="text-primary hover:underline">
                info@merceton.com
              </a>
            </li>
            <li>
              Phone:{" "}
              <a href="tel:9289109004" className="text-primary hover:underline">
                9289109004
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
          <ul className="space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Smarkitals Technologies India Pvt Ltd. All rights reserved.
      </div>
    </div>
  </footer>
)

export default Footer

