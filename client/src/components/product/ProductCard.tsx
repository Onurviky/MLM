import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useCartFeedback } from "@/context/CartFeedbackContext";
import { useAddToCart } from "@/hooks/useCart";
import { formatPrice, classNames } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { push } = useToast();
  const { notifyAdded } = useCartFeedback();
  const addToCart = useAddToCart();
  const [pickerOpen, setPickerOpen] = useState(false);

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;
  const availableVariants = product.variants.filter((v) => v.stock > 0);

  function addVariant(variantId: string) {
    if (!user) {
      push("Iniciá sesión para agregar al carrito", "error");
      return;
    }
    addToCart.mutate(
      { variantId, quantity: 1 },
      {
        onSuccess: (data) => {
          notifyAdded({ items: data.items, variantId, excludeProductId: product.id });
          setPickerOpen(false);
        },
      },
    );
  }

  function handleAddClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (availableVariants.length === 0) return;
    if (availableVariants.length === 1) {
      addVariant(availableVariants[0].id);
    } else {
      setPickerOpen((v) => !v);
    }
  }

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {totalStock === 0 && <Badge tone="accent">Sin stock</Badge>}
            {hasDiscount && totalStock > 0 && <Badge tone="accent">-{discountPercent}%</Badge>}
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink">{product.name}</p>
            <p className="mt-1 text-xs uppercase tracking-widest2 text-ink-dim">{product.category.name}</p>
          </div>
          <div className="flex flex-col items-end whitespace-nowrap">
            {hasDiscount && (
              <span className="text-xs text-ink-dim line-through">{formatPrice(product.compareAtPriceCents!)}</span>
            )}
            <p className="text-sm text-ink-muted">{formatPrice(product.priceCents)}</p>
          </div>
        </div>
      </Link>

      {totalStock > 0 && (
        <div className="mt-3">
          {pickerOpen ? (
            <div className="flex flex-wrap items-center gap-1.5 border border-border-strong bg-elevated p-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock === 0 || addToCart.isPending}
                  onClick={() => addVariant(v.id)}
                  className={classNames(
                    "h-8 min-w-[2rem] border px-2 text-xs transition-colors",
                    v.stock === 0
                      ? "cursor-not-allowed border-border text-ink-dim line-through"
                      : "border-border-strong text-ink hover:border-ink hover:bg-ink hover:text-bg",
                  )}
                >
                  {v.size}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="ml-auto text-xs text-ink-dim hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddClick}
              disabled={addToCart.isPending}
              className="flex w-full items-center justify-center gap-2 border border-border-strong py-2 text-xs uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bg disabled:opacity-50"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Agregar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
