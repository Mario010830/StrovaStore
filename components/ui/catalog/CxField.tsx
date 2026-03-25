"use client";

import type { InputHTMLAttributes } from "react";

export type CxFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function CxField({ label, hint, className, id, ...props }: CxFieldProps) {
  const controlId = id ?? props.name ?? undefined;
  return (
    <div className={["cx-field", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="cx-field__label" htmlFor={controlId}>
          {label}
        </label>
      ) : null}
      <input id={controlId} className="cx-input" {...props} />
      {hint ? <div className="cx-field__hint">{hint}</div> : null}
    </div>
  );
}

