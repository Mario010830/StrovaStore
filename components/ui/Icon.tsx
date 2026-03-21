"use client";

export function Icon({
  name,
  className,
  outlined,
}: {
  name: string;
  className?: string;
  /** Usa Material Icons Outlined (requiere la hoja de estilos en layout). */
  outlined?: boolean;
}) {
  const fontClass = outlined ? "material-icons-outlined" : "material-icons";
  return (
    <span
      className={`${fontClass} ${className ?? ""}`}
      style={{ fontSize: "inherit", width: "1em", height: "1em" }}
      aria-hidden
    >
      {name}
    </span>
  );
}
