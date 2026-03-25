/** Boundary de Suspense para rutas bajo /catalog (p. ej. useSearchParams en page). */
export default function CatalogSegmentLoading() {
  return (
    <div className="sp-layout" aria-busy="true">
      <main className="sp-main" style={{ padding: "40px 24px" }}>
        <p style={{ textAlign: "center", color: "#64748b", margin: 0, fontSize: "0.9375rem" }}>
          Cargando catálogo…
        </p>
      </main>
    </div>
  );
}
