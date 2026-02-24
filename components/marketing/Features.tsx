import { Store, Globe, CreditCard, Receipt, BookOpen, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const features = [
  {
    icon: Store,
    title: "Storefront & Themes",
    description: "Launch a beautiful, mobile-first storefront with pre-built themes that match your brand identity.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Connect your own domain so customers see your brand — not ours. SSL included automatically.",
  },
  {
    icon: CreditCard,
    title: "Cashfree Payments",
    description: "Accept UPI, cards, wallets, and net banking instantly via Cashfree with zero integration hassle.",
  },
  {
    icon: Receipt,
    title: "Platform Fees + GST (18%)",
    description: "Transparent fee deduction of ₹5 + 2% per order with 18% GST applied automatically on platform fees.",
  },
  {
    icon: BookOpen,
    title: "Ledger & Payouts",
    description: "Real-time internal ledger tracks every rupee. Weekly settlements deposited straight to your bank.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Controls & KYC",
    description: "Complete merchant KYC verification, admin dashboard, and granular role-based access controls.",
  },
]

const Features = () => (
  <section id="features" className="scroll-mt-20 py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to sell online
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          From storefront to settlement — one platform, zero complexity.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card
            key={f.title}
            className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <CardHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-primary/10">
                <f.icon className="h-5 w-5 text-accent-foreground transition-colors group-hover:text-primary" />
              </div>
              <CardTitle className="text-lg">{f.title}</CardTitle>
              <CardDescription className="leading-relaxed">{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  </section>
)

export default Features

