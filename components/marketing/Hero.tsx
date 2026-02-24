import { Button } from "@/components/ui/button"
import { ArrowRight, Play, ShoppingBag, CreditCard, BarChart3, Globe } from "lucide-react"

const HeroIllustration = () => (
  <div className="relative mx-auto mt-12 w-full max-w-lg lg:mt-0">
    <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-3xl" />
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl">
      {/* Mock storefront */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">Your Store</div>
          <div className="text-xs text-muted-foreground">store.yourdomain.in</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Order #1042</span>
          </div>
          <span className="text-xs font-semibold text-primary">₹2,499</span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Platform fee</span>
          </div>
          <span className="text-xs text-muted-foreground">₹5 + 2%</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-accent p-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent-foreground" />
            <span className="text-xs font-medium text-accent-foreground">Settlement</span>
          </div>
          <span className="text-xs font-semibold text-accent-foreground">Weekly</span>
        </div>
      </div>
    </div>
  </div>
)

const Hero = () => {
  const scrollToFeatures = () => {
    document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      className={[
        "relative overflow-hidden py-20 lg:py-28",
        // ✅ Replaces bg-hero with a lighter premium gradient
        "bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900",
      ].join(" ")}
    >
      {/* Optional: very subtle lift layer (keeps it readable without washing out) */}
      <div className="pointer-events-none absolute inset-0 bg-white/5" />

      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[500px] w-[800px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
  Start{" "}
  <span className="text-hero-foreground">selling</span>{" "}
  online in{" "}
  <span className="text-gradient-purple">minutes</span>, not weeks.
</h1>

<p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 lg:mx-0">
              Launch your storefront with a custom domain, accept Razorpay payments, and let Merceton
              handle platform fee deduction, internal ledger, and weekly settlements — with complete
              merchant isolation.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <a href="https://app.merceton.com/sign-up">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={scrollToFeatures}
                className="w-full border-hero-muted/20 text-hero-foreground hover:bg-hero-foreground/5 sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4" /> View demo
              </Button>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}

export default Hero