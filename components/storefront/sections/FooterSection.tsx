interface FooterLink {
  label: string
  href: string
}

interface FooterSectionProps {
  brandName: string
  links?: FooterLink[]
}

export function FooterSection({ brandName, links = [] }: FooterSectionProps) {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} {brandName}. All rights reserved.</span>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {links.map((link, index) => (
              <a
                key={`${link.href}-${index}`}
                href={link.href}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}

