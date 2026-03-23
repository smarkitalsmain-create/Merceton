import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getLegalPolicyContent, type LegalPolicyKey } from "@/lib/legal-policies"

interface LegalPolicyPageProps {
  policyKey: LegalPolicyKey
}

export default async function LegalPolicyPage({ policyKey }: LegalPolicyPageProps) {
  const policy = await getLegalPolicyContent(policyKey)

  return (
    <section className="py-12 sm:py-16">
      <div className="container max-w-4xl">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {policy.title}
          </h1>
          {policy.lastUpdated ? (
            <p className="mt-3 text-sm text-muted-foreground">Last updated: {policy.lastUpdated}</p>
          ) : null}
        </header>

        <article className="text-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h2 className="mt-8 text-2xl font-bold first:mt-0">{children}</h2>
              ),
              h2: ({ children }) => <h3 className="mt-8 text-xl font-semibold">{children}</h3>,
              h3: ({ children }) => <h4 className="mt-6 text-lg font-semibold">{children}</h4>,
              p: ({ children }) => (
                <p className="mt-4 leading-7 text-foreground/90 first:mt-0">{children}</p>
              ),
              ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6">{children}</ul>,
              ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6">{children}</ol>,
              li: ({ children }) => <li className="leading-7">{children}</li>,
              hr: () => <hr className="my-8 border-border" />,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  {children}
                </a>
              ),
            }}
          >
            {policy.markdown}
          </ReactMarkdown>
        </article>
      </div>
    </section>
  )
}

