import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu pedido — Tu Cuadre",
  description: "Detalle de tu orden confirmada",
  robots: "noindex",
};

/**
 * Standalone layout for /pedido pages — no app chrome (navbar, cart, etc.)
 * so the seller sees a clean order summary.
 */
export default function PedidoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
