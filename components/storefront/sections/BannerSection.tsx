interface BannerSectionProps {
  text: string
  link?: string
}

export function BannerSection({ text, link }: BannerSectionProps) {
  const content = (
    <div className="w-full py-3 px-4 bg-primary text-primary-foreground text-center text-sm">
      {text}
    </div>
  )

  if (link) {
    return (
      <section className="py-4">
        <a href={link}>{content}</a>
      </section>
    )
  }

  return <section className="py-4">{content}</section>
}

