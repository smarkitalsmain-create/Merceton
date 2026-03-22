import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const faqs = [
  {
    q: "Do you handle shipping directly?",
    a: "Merceton does not handle shipping directly. You can integrate with any shipping provider of your choice. Shipping charges are managed and billed separately by the provider.",
  },
  {
    q: "How do platform fees work?",
    a: "You pay a platform fee on successful orders. The exact fee is applied automatically, and your settlements are handled on a regular payout cycle.",
  },
  {
    q: "Can I connect a custom domain?",
    a: "Yes. Merceton supports custom domains so customers see your brand. SSL is handled automatically.",
  },
  {
    q: "Do you support invoices and payment reconciliation?",
    a: "Yes. Merceton generates invoices and provides ledger visibility so you can reconcile orders and payouts with confidence.",
  },
  {
    q: "Is merchant data isolated?",
    a: "Yes. Merchant data is scoped to your account so you can only access your own storefront and transactions.",
  },
]

const FAQ = () => (
  <section id="faq" className="scroll-mt-20 py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Quick answers to help you get started with Merceton.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {faqs.map((item) => (
          <Card
            key={item.q}
            className="border-border/60 bg-card/60 shadow-sm"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{item.q}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
)

export default FAQ

