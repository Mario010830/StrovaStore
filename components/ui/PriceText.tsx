import { formatPrice } from "@/lib/format";

interface PriceTextProps {
  value: number;
  className?: string;
}

export function PriceText({ value, className }: PriceTextProps) {
  return <span className={className}>{formatPrice(value)}</span>;
}
