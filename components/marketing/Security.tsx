import { ShieldCheck, FileSearch, Webhook, KeyRound } from "lucide-react"

const items = [
  {
    icon: ShieldCheck,
    title: "Merchant data isolation",
    description: "Each merchant's data is fully scoped and isolated. No cross-merchant access is possible.",
  },
  {
    icon: FileSearch,
    title: "Audit logs & admin actions",
    description: "Every admin action is logged with timestamps and user context for full accountability.",
  },
  {
    icon: Webhook,
    title: "Secure webhooks",
    description: "All incoming webhooks are verified with signatures to prevent tampering and replay attacks.",
  },
  {
    icon: KeyRound,
    title: "Least privilege access",
    description: "Role-based permissions ensure users only access what they need — nothing more.",
  },
]

const Security = () => (
  <section id="security" className="scroll-mt-20 bg-section-alt py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Security & Compliance
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Built from the ground up with enterprise-grade security practices.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default Security

