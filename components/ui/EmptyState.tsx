import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, message, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`store-empty${compact ? " store-empty--compact" : ""}`}>
      <div className="store-empty__icon">{icon}</div>
      <p className="store-empty__text">{message}</p>
      {action}
    </div>
  );
}
