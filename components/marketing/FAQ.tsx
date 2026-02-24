import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "What is Merceton?",
    a: "Merceton is an India-first e-commerce enablement platform that lets SMEs launch online stores with built-in payments, automated fee management, and weekly bank settlements — all without any technical expertise.",
  },
  {
    q: "How do settlements work?",
    a: "After each order, the platform fee (₹5 + 2% + GST) is automatically deducted. Your net earnings are accumulated in an internal ledger and settled to your registered bank account every week.",
  },
  {
    q: "Do you provide shipping?",
    a: "Merceton does not handle shipping directly. You can integrate with any shipping provider of your choice. Shipping charges are managed and billed separately by the provider.",
  },
  {
    q: "Can I use my own domain?",
    a: "Absolutely. You can connect your own custom domain to your Merceton storefront with free SSL. Your customers will only see your brand.",
  },
  {
    q: "What charges apply?",
    a: "You pay ₹5 + 2% per successful order, plus 18% GST on the platform fee. Payment gateway charges by Razorpay and shipping costs are separate and charged by the respective providers.",
  },
  {
    q: "What if my account is put on hold?",
    a: "If your account is flagged for compliance or policy reasons, we'll notify you via email with clear next steps. Pending settlements are held until the issue is resolved. You can reach out to our support team for assistance.",
  },
]

const FAQ = () => (
  <section id="faq" className="scroll-mt-20 py-20">
    <div className="container">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Got questions? We&apos;ve got answers.
        </p>
      </div>

      <Accordion type="single" collapsible className="mx-auto max-w-2xl">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
)

export default FAQ

