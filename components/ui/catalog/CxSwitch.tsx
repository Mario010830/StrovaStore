"use client";

export function CxSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="cx-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="cx-switch__track" aria-hidden />
      <span className="cx-switch__label">{label}</span>
    </label>
  );
}

