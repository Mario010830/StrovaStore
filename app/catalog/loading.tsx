/** Boundary de Suspense para rutas bajo /catalog (p. ej. useSearchParams en page). */
export default function CatalogSegmentLoading() {
  return (
    <div className="dir-page dir-mp" aria-busy="true">
      <div className="dir-shell dir-mp__shell" style={{ padding: "40px 24px" }}>
        <p style={{ textAlign: "center", color: "#64748b", margin: 0, fontSize: "0.9375rem" }}>
          Cargando catálogo…
        </p>
      </div>
    </div>
  );
}
