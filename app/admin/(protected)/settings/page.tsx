export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Receipt,
  Users,
  Shield,
  FileText,
  Settings,
  ArrowRight,
} from "lucide-react"

export default async function AdminSettingsPage() {
  await requireSuperAdmin()

  const settingsSections = [
    {
      title: "Invoice Issuer Profile",
      description: "Configure Smarkitals Technologies India Pvt Ltd billing details for platform invoices",
      href: "/admin/settings/billing",
      icon: Receipt,
      color: "text-blue-600",
    },
    {
      title: "Admin Users",
      description: "Manage admin user accounts and access",
      href: "/admin/settings/admin-users",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Roles & Permissions",
      description: "Configure roles and permission matrix",
      href: "/admin/settings/roles",
      icon: Shield,
      color: "text-purple-600",
    },
    {
      title: "Audit Logs",
      description: "View system audit trail and admin actions",
      href: "/admin/settings/audit-logs",
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "System Settings",
      description: "Feature flags, maintenance banner, and support contact",
      href: "/admin/settings/system",
      icon: Settings,
      color: "text-gray-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage platform configuration and admin access</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${section.color}`} />
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Configure</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
