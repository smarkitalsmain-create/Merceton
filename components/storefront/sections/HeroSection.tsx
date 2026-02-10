import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  headline: string
  subheadline?: string
  ctaText?: string
  ctaLink?: string
}

export function HeroSection({
  headline,
  subheadline,
  ctaText,
  ctaLink,
}: HeroSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 text-center space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          {headline}
        </h1>
        {subheadline && (
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {subheadline}
          </p>
        )}
        {ctaText && ctaLink && (
          <div>
            <Button asChild>
              <a href={ctaLink}>{ctaText}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

