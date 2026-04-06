import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Política de Privacidad</h1>
      <p style={{ color: "#64748b", lineHeight: 1.7 }}>
        La política de privacidad de StrovaStore se encuentra en proceso de publicación.
        Si tienes preguntas sobre el uso de tus datos, contáctanos a través de nuestros canales oficiales.
      </p>
      <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#185FA5", fontWeight: 600 }}>
        ← Volver al inicio
      </Link>
    </main>
  );
}
