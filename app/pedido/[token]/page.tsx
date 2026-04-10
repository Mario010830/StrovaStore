"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { decodeOrderToken } from "@/lib/order-token";
import { formatPrice } from "@/lib/format";
import "./order.css";

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const token = String(params.token ?? "");

  const order = useMemo(() => decodeOrderToken(token), [token]);

  if (!order) {
    return (
      <div className="order-page order-page--error">
        <div className="order-error-box">
          <span className="order-error-box__icon" aria-hidden>⚠️</span>
          <h1 className="order-error-box__title">Enlace inválido</h1>
          <p className="order-error-box__text">
            Este enlace de orden no es válido o ha expirado.
          </p>
          <Link href="/catalog" className="order-error-box__btn">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const subtotals = order.items.map((i) => i.qty * i.price);
  const total = subtotals.reduce((s, v) => s + v, 0);

  return (
    <div className="order-page">
      {/* Header */}
      <header className="order-header">
        <div className="order-header__brand">
          <span className="order-header__logo" aria-hidden>📦</span>
          <span className="order-header__brand-name">Tu Cuadre</span>
        </div>
        <span className="order-header__badge">Orden confirmada</span>
      </header>

      <main className="order-main">
        {/* Folio + meta */}
        <div className="order-card order-card--hero">
          <div className="order-folio">
            <span className="order-folio__label">Referencia</span>
            <span className="order-folio__value">{order.folio}</span>
          </div>
          <div className="order-meta">
            <div className="order-meta__row">
              <span className="order-meta__icon" aria-hidden>🏪</span>
              <span className="order-meta__text">{order.store}</span>
            </div>
            {order.ts > 0 && (
              <div className="order-meta__row">
                <span className="order-meta__icon" aria-hidden>🕐</span>
                <span className="order-meta__text">{formatDate(order.ts)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="order-card">
          <h2 className="order-section-title">Productos pedidos</h2>
          <div className="order-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <div className="order-item__qty">{item.qty}×</div>
                <div className="order-item__name">{item.name}</div>
                <div className="order-item__price-col">
                  <span className="order-item__subtotal">
                    {formatPrice(item.qty * item.price)}
                  </span>
                  {item.originalPrice != null && item.originalPrice > item.price ? (
                    <span className="order-item__unit-old">
                      Antes: {formatPrice(item.originalPrice)} c/u
                    </span>
                  ) : (
                    <span className="order-item__unit">
                      {formatPrice(item.price)} c/u
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="order-total-row">
            <span className="order-total-row__label">Total</span>
            <span className="order-total-row__value">{formatPrice(total)}</span>
          </div>

          <p className="order-price-note">
            ✅ Los precios de esta orden están fijados y no pueden ser modificados.
          </p>
        </div>

        {/* Customer info */}
        <div className="order-card">
          <h2 className="order-section-title">Datos de entrega</h2>
          <div className="order-customer">
            <div className="order-customer__row">
              <span className="order-customer__label">Nombre</span>
              <span className="order-customer__value">{order.customer.name}</span>
            </div>
            {order.customer.phone && (
              <div className="order-customer__row">
                <span className="order-customer__label">Teléfono</span>
                <span className="order-customer__value">{order.customer.phone}</span>
              </div>
            )}
            <div className="order-customer__row">
              <span className="order-customer__label">Dirección</span>
              <span className="order-customer__value">{order.customer.address}</span>
            </div>
            {order.customer.notes && (
              <div className="order-customer__row">
                <span className="order-customer__label">Notas</span>
                <span className="order-customer__value">{order.customer.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="order-footer-note">
          Esta orden fue generada por{" "}
          <Link href="/" className="order-footer-note__link">
            Tu Cuadre
          </Link>{" "}
          y enviada directamente al negocio.
        </p>
      </main>
    </div>
  );
}
