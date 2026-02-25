import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShieldAlert,
  FileCheck,
  Globe,
  Wallet,
  Loader2,
} from "lucide-react"
import type { OpsOverviewResult } from "@/lib/admin/ops-overview"

interface OpsOverviewProps {
  data: OpsOverviewResult
}

export function OpsOverview({ data }: OpsOverviewProps) {
  const cards = [
    {
      title: "Merchants on hold",
      value: data.merchantsOnHold,
      icon: ShieldAlert,
      href: "/admin/merchants",
      description: "Account status ON_HOLD",
    },
    {
      title: "KYC pending",
      value: data.kycPending,
      icon: FileCheck,
      href: "/admin/merchants",
      description: "Pending or submitted",
    },
    {
      title: "Domains pending",
      value: data.domainsPending,
      icon: Globe,
      href: "/admin/domains",
      description: "Domain verification",
    },
    {
      title: "Payouts awaiting approval",
      value: data.payoutsAwaitingApproval,
      icon: Wallet,
      href: "/admin/payouts",
      description: "Status PENDING",
    },
    {
      title: "Payouts pending execution",
      value: data.payoutsPendingExecution,
      icon: Loader2,
      href: "/admin/payouts",
      description: "Status PROCESSING",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ops overview</CardTitle>
        <CardDescription>
          Operational counts. Use links to drill down.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.warnings && data.warnings.length > 0 && (
          <p className="mb-4 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            {data.warnings.join("; ")}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
