"use client"

import * as React from "react"
import Link from "next/link"
import {
  Store,
  TrendingUp,
  CreditCard,
  Lock,
  Shield,
  Settings,
  Mail,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type AuthVariant = "merchant" | "admin"
export type AuthMode = "signin" | "signup"

const VALUE_PROPS_MERCHANT = [
  { icon: Store, text: "Your store, your brand" },
  { icon: TrendingUp, text: "Sell and scale with one dashboard" },
  { icon: CreditCard, text: "Transparent fees, weekly payouts" },
] as const

const VALUE_PROPS_ADMIN = [
  { icon: Lock, text: "Secure admin access" },
  { icon: Shield, text: "Audit trail for every action" },
  { icon: Settings, text: "Full platform control" },
] as const

const THOUGHTFUL_LINE: Record<AuthVariant, Record<AuthMode, string>> = {
  merchant: {
    signin: "Build steadily. Ship daily. Earn trust.",
    signup: "Start small. Sell smart. Scale cleanly.",
  },
  admin: {
    signin: "Secure access. Clear audit. Full control.",
    signup: "Admin access. Super Admin only.",
  },
}

const PILLS_MERCHANT = ["Fast setup", "Weekly payouts", "Custom domain"]
const PILLS_ADMIN = ["Super Admin only", "Audit logs", "Secure"]

export interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  variant?: AuthVariant
  mode: AuthMode
  /** Footer link: e.g. "Don't have an account? Sign up" with href */
  footerLink?: { label: string; href: string; linkText: string }
  className?: string
}

export function AuthShell({
  title,
  subtitle,
  children,
  variant = "merchant",
  mode,
  footerLink,
  className,
}: AuthShellProps) {
  const valueProps = variant === "admin" ? VALUE_PROPS_ADMIN : VALUE_PROPS_MERCHANT
  const thoughtfulLine = THOUGHTFUL_LINE[variant][mode]
  const pills = variant === "admin" ? PILLS_ADMIN : PILLS_MERCHANT

  return (
    <div
      className={cn(
        "min-h-screen grid grid-cols-1 lg:grid-cols-3 bg-background text-foreground",
        "animate-in fade-in-0 duration-500 ease-out",
        className
      )}
    >
      {/* Left panel: branded / marketing */}
      <div
        className={cn(
          "relative flex flex-col justify-between p-8 lg:p-10 xl:p-12",
          "bg-gradient-to-br from-primary/10 via-background to-primary/5",
          "dark:from-primary/20 dark:via-background dark:to-primary/10",
          "border-r border-border/50 lg:col-span-2",
          "min-h-[280px] lg:min-h-screen"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--primary)/.08),transparent] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <Link
              href={variant === "admin" ? "/admin/sign-in" : "/"}
              className="text-xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
            >
              Merceton
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {variant === "admin" ? "Platform admin" : "Sell direct. Get paid. Scale clean."}
            </p>
          </div>

          <ul className="space-y-4">
            {valueProps.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-muted-foreground">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>

          <blockquote className="border-l-2 border-primary/50 pl-4 text-sm italic text-muted-foreground">
            {thoughtfulLine}
          </blockquote>

          <div className="flex flex-wrap gap-2">
            {pills.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          <span>Continue with email</span>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 lg:col-span-1">
        <div className="w-full max-w-sm mx-auto">
          <Card className="border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
              {subtitle && (
                <CardDescription className="text-muted-foreground">
                  {subtitle}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {children}
              {footerLink && (
                <p className="pt-2 text-center text-sm text-muted-foreground">
                  {footerLink.label}{" "}
                  <Link
                    href={footerLink.href}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {footerLink.linkText}
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
