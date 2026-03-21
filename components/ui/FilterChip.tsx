import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface FilterChipProps {
  label: string;
  active?: boolean;
  iconName?: string;
  onClick: () => void;
  className: string;
  activeClassName: string;
  icon?: ReactNode;
}

export function FilterChip({
  label,
  active = false,
  iconName,
  onClick,
  className,
  activeClassName,
  icon,
}: FilterChipProps) {
  const classes = `${className}${active ? ` ${activeClassName}` : ""}`;

  return (
    <button type="button" className={classes} onClick={onClick}>
      {icon ?? (iconName ? <Icon name={iconName} /> : null)}
      {label}
    </button>
  );
}
