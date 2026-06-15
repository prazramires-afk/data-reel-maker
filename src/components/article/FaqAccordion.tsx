import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (!faqs?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-3">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl px-4">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f-${i}`} className="border-border">
            <AccordionTrigger className="text-left text-foreground font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}