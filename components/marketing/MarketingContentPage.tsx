import type { ReactNode } from "react"

interface MarketingContentPageProps {
  title: string
  children: ReactNode
}

/**
 * Centered, readable layout for static marketing pages (about, contact, etc.).
 * Matches spacing/typography patterns used on legal policy pages.
 */
export function MarketingContentPage({ title, children }: MarketingContentPageProps) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container max-w-4xl">
        <header className="mb-10 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
        </header>
        <div className="space-y-8 text-foreground">{children}</div>
      </div>
    </section>
  )
}

export function MarketingSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {heading}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-foreground/90 sm:text-base">{children}</div>
    </section>
  )
}

export function MarketingProse({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-[15px] leading-7 text-foreground/90 sm:text-base">{children}</div>
}
