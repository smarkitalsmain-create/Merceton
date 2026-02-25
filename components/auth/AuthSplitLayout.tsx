"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AuthBullet {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

export interface AuthTestimonial {
  quote: string
  author?: string
  role?: string
}

export interface AuthSplitLayoutProps {
  title: string
  subtitle?: string
  bullets: AuthBullet[]
  testimonial: AuthTestimonial
  stats: string[]
  children: React.ReactNode
  /** Optional footer line e.g. "Don't have an account? Sign up" */
  footerLink?: { label: string; href: string; linkText: string }
  className?: string
}

export function AuthSplitLayout({
  title,
  subtitle,
  bullets,
  testimonial,
  stats,
  children,
  footerLink,
  className,
}: AuthSplitLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground",
        "animate-in fade-in-0 duration-500 ease-out",
        className
      )}
    >
      {/* Form panel: first on mobile (order-1), right on desktop (col-start-2) */}
      <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-[400px] mx-auto">
          <Card className="border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
              {subtitle && (
                <CardDescription className="text-muted-foreground">{subtitle}</CardDescription>
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

      {/* Content panel: second on mobile (order-2), left on desktop (col-start-1) */}
      <div
        className={cn(
          "order-2 lg:order-none lg:col-start-1 lg:row-start-1",
          "relative flex flex-col justify-center p-8 sm:p-10 lg:p-12 xl:p-16",
          "bg-gradient-to-br from-primary/10 via-background to-primary/5",
          "dark:from-primary/15 dark:via-background dark:to-primary/10",
          "min-h-[50vh] lg:min-h-screen"
        )}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--primary)/.12),transparent_70%] pointer-events-none" />

        <div className="relative z-10 max-w-md">
          <Link
            href="/"
            className="inline-block text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Merceton
          </Link>

          <h2 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Sell direct. Get paid. Scale clean.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            One dashboard for your store, orders, and payouts. No code. No lock-in.
          </p>

          <ul className="mt-8 space-y-4" role="list">
            {bullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          <Card className="mt-8 border-border/80 bg-background/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm italic text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
              {(testimonial.author ?? testimonial.role) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {testimonial.author}
                  {testimonial.author && testimonial.role && " · "}
                  {testimonial.role}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-2" role="list">
            {stats.map((stat) => (
              <span
                key={stat}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary border border-primary/20"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
