import { Shield, FileText, Zap, CalendarCheck, Lock } from "lucide-react"

const items = [
  { icon: Shield, label: "Secure payments" },
  { icon: FileText, label: "GST-ready invoices" },
  { icon: Zap, label: "Fast onboarding" },
  { icon: CalendarCheck, label: "Weekly settlements" },
  { icon: Lock, label: "Merchant-scoped isolation" },
]

const TrustStrip = () => (
  <section className="border-b border-border bg-section-alt py-8">
    <div className="container">
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
            <item.icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default TrustStrip

