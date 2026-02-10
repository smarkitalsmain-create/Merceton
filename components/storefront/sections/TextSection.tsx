interface TextSectionProps {
  title: string
  body: string
}

export function TextSection({ title, body }: TextSectionProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-muted-foreground whitespace-pre-line">{body}</p>
      </div>
    </section>
  )
}

