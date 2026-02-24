import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, MessageCircle } from "lucide-react"

const included = [
  "Unlimited products",
  "Custom domain support",
  "Razorpay payment gateway",
  "Internal ledger & reconciliation",
  "Weekly bank settlements",
  "Merchant dashboard access",
]

const Pricing = () => (
  <section id="pricing" className="scroll-mt-20 py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No monthly fees. Pay only when you earn.
        </p>
      </div>

      <Card className="glow-purple mx-auto max-w-md border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pay per order</CardTitle>
          <div className="mt-4">
            <span className="text-5xl font-bold tracking-tight text-foreground">₹5</span>
            <span className="ml-1 text-lg text-muted-foreground">+ 2% per order</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">+ GST (18%) on platform fees</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Payment gateway charges and shipping costs are charged separately by respective providers.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" asChild>
              <a href="https://app.merceton.com/sign-up">Get started free</a>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <a href="mailto:info@smarkitalstech.com">
                <MessageCircle className="mr-2 h-4 w-4" /> Talk to us
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
)

export default Pricing

