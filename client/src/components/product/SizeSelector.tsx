import { classNames } from "@/lib/utils";
import type { Variant } from "@/types";

export function SizeSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const disabled = variant.stock === 0;
        const selected = variant.id === selectedId;
        return (
          <button
            key={variant.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(variant.id)}
            className={classNames(
              "h-12 min-w-[3rem] border px-4 text-sm transition-colors",
              disabled && "cursor-not-allowed border-border text-ink-dim line-through",
              !disabled && selected && "border-ink bg-ink text-bg",
              !disabled && !selected && "border-border-strong text-ink hover:border-ink",
            )}
          >
            {variant.size}
          </button>
        );
      })}
    </div>
  );
}
