import type { ReactNode } from "react";

interface StatusBadgeProps {
  label: string;
  active?: boolean;
  className: string;
  inactiveClassName?: string;
  icon?: ReactNode;
  dataStock?: boolean;
}

export function StatusBadge({
  label,
  active = true,
  className,
  inactiveClassName,
  icon,
  dataStock,
}: StatusBadgeProps) {
  const classes = `${className}${!active && inactiveClassName ? ` ${inactiveClassName}` : ""}`;
  return (
    <span className={classes} data-stock={dataStock ? "true" : undefined}>
      {icon}
      {label}
    </span>
  );
}
