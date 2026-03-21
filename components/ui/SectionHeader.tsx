import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="ui-section-header">
      <div>
        <h1 className="ui-section-header__title">{title}</h1>
        {subtitle ? <p className="ui-section-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-section-header__actions">{actions}</div> : null}
    </div>
  );
}
