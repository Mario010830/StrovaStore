"use client";

export function RatingStars({
  value,
  reviews,
  className,
}: {
  value: number;
  reviews?: string | number | null;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const rounded = Math.round(safe);
  const stars = "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
  return (
    <div className={["cx-rating", className].filter(Boolean).join(" ")} aria-label={`Calificación ${safe.toFixed(1)} de 5`}>
      <span className="cx-rating__stars" aria-hidden>
        {stars}
      </span>
      <span className="cx-rating__meta">
        {safe.toFixed(1)}
        {reviews != null ? ` (${reviews})` : ""}
      </span>
    </div>
  );
}

