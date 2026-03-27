import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Términos y Condiciones</h1>
      <p style={{ color: "#64748b", lineHeight: 1.7 }}>
        Los términos y condiciones de uso de StrovaStore se encuentran en proceso de publicación.
        Si tienes preguntas, contáctanos a través de nuestros canales oficiales.
      </p>
      <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#185FA5", fontWeight: 600 }}>
        ← Volver al inicio
      </Link>
    </main>
  );
}
