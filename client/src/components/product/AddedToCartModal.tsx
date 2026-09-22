import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type AddedItem = {
  image: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: AddedItem;
  itemCount: number;
  subtotalCents: number;
  suggestion?: Product | null;
};

export function AddedToCartModal({ open, onClose, item, itemCount, subtotalCents, suggestion }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg/80 px-4 py-10 backdrop-blur-sm">
      <div className="animate-page-in w-full max-w-lg border border-border-strong bg-elevated">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <p className="text-sm font-medium uppercase tracking-widest2 text-ink">Agregado al carrito</p>
          <button onClick={onClose} aria-label="Cerrar" className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-start gap-4 px-6 py-6">
          <div className="h-24 w-20 shrink-0 overflow-hidden bg-surface">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              {item.name} {item.variantLabel && <span className="text-ink-muted">({item.variantLabel})</span>}
            </p>
            <p className="mt-1 text-xs text-ink-dim">
              {item.quantity} x {formatPrice(item.unitPriceCents)}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              Total ({itemCount} {itemCount === 1 ? "producto" : "productos"})
            </span>
            <span className="text-ink">{formatPrice(subtotalCents)}</span>
          </div>
          <Link to="/cart" onClick={onClose}>
            <Button className="w-full">Ver carrito</Button>
          </Link>
        </div>

        {suggestion && (
          <div className="border-t border-border px-6 py-8">
            <p className="mb-5 text-center text-xs uppercase tracking-widest2 text-ink-dim">Suma a tu compra</p>
            <Link
              to={`/product/${suggestion.slug}`}
              onClick={onClose}
              className="group flex items-center gap-4 hover:opacity-90"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden bg-surface">
                <img src={suggestion.images[0]} alt={suggestion.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm text-ink group-hover:underline">{suggestion.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatPrice(suggestion.priceCents)}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
