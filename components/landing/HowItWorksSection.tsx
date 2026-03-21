import { SectionHeader } from "@/components/landing/SectionHeader";

const STEPS = [
  {
    title: "Descubrí tiendas cercanas",
    description:
      "Entrá al catálogo, filtrá por categoría y encontrá opciones locales en pocos segundos.",
    cta: "Ir a tiendas",
    href: "/catalog",
  },
  {
    title: "Elegí productos y armá tu pedido",
    description:
      "Compará precios, revisá disponibilidad y agregá al carrito lo que realmente necesitás.",
    cta: "Ver productos",
    href: "/catalog?tab=productos",
  },
  {
    title: "Confirmá por WhatsApp",
    description:
      "Finalizá con un mensaje prearmado y coordiná entrega/pago directo con el comercio.",
    cta: "Cómo comprar",
    href: "/catalog",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="landing-section landing-section--landing-block landing-section--how-it landing-shell landing-anim">
      <SectionHeader
        eyebrow="Cómo funciona"
        title="Paso a paso para comprar mejor"
        subtitle="Diseñado para ser claro: descubrís, elegís y confirmás en un flujo simple y rápido."
      />

      <div className="landing-how-it__steps">
        {STEPS.map((step, index) => (
          <article key={step.title} className="landing-how-it__step">
            <span className="landing-how-it__num" aria-hidden>
              {index + 1}
            </span>
            <h3 className="landing-how-it__step-title">{step.title}</h3>
            <p className="landing-how-it__step-desc">{step.description}</p>
            <a href={step.href} className="landing-how-it__step-link">
              {step.cta}
              <span aria-hidden> →</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
