import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/landing/SectionHeader";

const STEPS = [
  {
    title: "Descubrí tiendas cercanas",
    description:
      "Entrá al catálogo, filtrá por categoría y encontrá opciones locales en pocos segundos.",
    icon: "search",
    cta: "Ir a tiendas",
    href: "/catalog",
  },
  {
    title: "Elegí productos y armá tu pedido",
    description:
      "Compará precios, revisá disponibilidad y agregá al carrito lo que realmente necesitás.",
    icon: "shopping_basket",
    cta: "Ver productos",
    href: "/catalog?tab=productos",
  },
  {
    title: "Confirmá por WhatsApp",
    description:
      "Finalizá con un mensaje prearmado y coordiná entrega/pago directo con el comercio.",
    icon: "chat",
    cta: "Cómo comprar",
    href: "/catalog",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="landing-section landing-shell landing-anim">
      <SectionHeader
        eyebrow="Cómo funciona"
        title="Paso a paso para comprar mejor"
        subtitle="Diseñado para ser claro: descubrís, elegís y confirmás en un flujo simple y rápido."
      />

      <div className="landing-steps-flow">
        {STEPS.map((step, index) => (
          <article key={step.title} className="landing-step-card">
            <div className="landing-step-card__top">
              <span className="landing-step-card__index">Paso {index + 1}</span>
              <span className="landing-step-card__icon" aria-hidden>
                <Icon name={step.icon} />
              </span>
            </div>
            <h3 className="landing-step-card__title">{step.title}</h3>
            <p className="landing-step-card__desc">{step.description}</p>
            <a href={step.href} className="landing-step-card__link">
              {step.cta}
              <Icon name="arrow_forward" />
            </a>
            {index < STEPS.length - 1 ? <span className="landing-step-card__connector" aria-hidden /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
