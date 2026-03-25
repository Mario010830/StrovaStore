"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export type CxButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconName?: string;
  icon?: ReactNode;
};

export function CxButton({
  variant = "primary",
  size = "md",
  iconName,
  icon,
  className,
  children,
  ...props
}: CxButtonProps) {
  const classes = [
    "cx-btn",
    `cx-btn--${variant}`,
    `cx-btn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={classes}>
      {icon ?? (iconName ? <Icon name={iconName} /> : null)}
      {children}
    </button>
  );
}

