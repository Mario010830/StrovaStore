import { SectionHeader } from "@/components/landing/SectionHeader";

const STEPS = [
  {
    title: "Descubre tiendas cercanas",
    description:
      "Entra al catálogo, filtra por categoría y encuentra opciones locales en pocos segundos.",
    cta: "Ir a tiendas",
    href: "/catalog",
  },
  {
    title: "Elige productos y arma tu pedido",
    description:
      "Compara precios, revisa disponibilidad y agrega al carrito lo que realmente necesitas.",
    cta: "Ver productos",
    href: "/catalog?tab=productos",
  },
  {
    title: "Confirma por WhatsApp",
    description:
      "Finaliza con un mensaje prearmado y coordina entrega y pago directo con el comercio.",
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
        subtitle="Diseñado para ser claro: descubres, eliges y confirmas en un flujo simple y rápido."
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
