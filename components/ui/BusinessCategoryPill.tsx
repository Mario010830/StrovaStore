import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";

/** Pill compacto: ícono Lucide 12px + nombre 11px; no renderiza si no hay nombre. */
export function BusinessCategoryPill({ name }: { name: string | null | undefined }) {
  if (!name?.trim()) return null;
  const Icon = getBusinessCategoryLucideIcon(name);
  return (
    <span className="bc-pill">
      <Icon className="bc-pill__icon" size={12} strokeWidth={2} aria-hidden />
      <span className="bc-pill__label">{name}</span>
    </span>
  );
}
