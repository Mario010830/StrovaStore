"use client";

import { Icon } from "@/components/ui/Icon";

type Props = {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
  labelOn: string;
  labelOff: string;
  className?: string;
};

/**
 * Botón compacto esquina superior derecha (corazón). El padre debe ser `position: relative`.
 */
export function CardFavoriteButton({ isFavorite, onToggle, labelOn, labelOff, className }: Props) {
  return (
    <button
      type="button"
      className={["card-fav-btn", className].filter(Boolean).join(" ")}
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? labelOn : labelOff}
      title={isFavorite ? labelOn : labelOff}
    >
      <Icon name={isFavorite ? "favorite" : "favorite_border"} />
    </button>
  );
}
