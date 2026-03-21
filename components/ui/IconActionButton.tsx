import type { MouseEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface IconActionButtonProps {
  label: string;
  iconName?: string;
  className: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  icon?: ReactNode;
}

export function IconActionButton({
  label,
  iconName,
  className,
  onClick,
  type = "button",
  disabled = false,
  icon,
}: IconActionButtonProps) {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {icon ?? (iconName ? <Icon name={iconName} /> : null)}
      {label}
    </button>
  );
}
