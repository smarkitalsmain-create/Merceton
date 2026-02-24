import { UserCheck, Rocket, Banknote } from "lucide-react"

const steps = [
  {
    icon: UserCheck,
    step: "01",
    title: "Complete KYC & bank details",
    description: "Submit your business documents and bank account. Verification is quick and hassle-free.",
  },
  {
    icon: Rocket,
    step: "02",
    title: "Launch storefront & connect domain",
    description: "Pick a theme, add products, and point your custom domain. You're live in minutes.",
  },
  {
    icon: Banknote,
    step: "03",
    title: "Receive orders → fees deducted → settlements",
    description:
      "Orders come in, platform fees are auto-deducted, and net earnings settle to your bank weekly.",
  },
]

const HowItWorks = () => (
  <section id="how-it-works" className="scroll-mt-20 bg-section-alt py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Three simple steps from sign-up to your first settlement.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.step} className="relative text-center">
            {i < steps.length - 1 && (
              <div className="absolute left-1/2 top-12 hidden h-px w-full bg-border md:block" />
            )}
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <s.icon className="h-6 w-6 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {s.step}
              </span>
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default HowItWorks

