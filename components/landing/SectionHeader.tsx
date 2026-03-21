import Link from "next/link";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  return (
    <div className="landing-section-header">
      <div>
        {eyebrow ? <p className="landing-section-header__eyebrow">{eyebrow}</p> : null}
        <h2 className="landing-section-header__title">{title}</h2>
        {subtitle ? <p className="landing-section-header__subtitle">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="landing-section-header__action">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
