import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div className="inline-flex h-12 items-center border border-border-strong">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-full w-11 items-center justify-center text-ink-muted hover:text-ink"
        aria-label="Restar cantidad"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-11 items-center justify-center text-ink-muted hover:text-ink"
        aria-label="Sumar cantidad"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
