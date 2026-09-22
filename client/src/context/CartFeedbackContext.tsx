import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { AddedToCartModal } from "@/components/product/AddedToCartModal";
import type { CartItem } from "@/types";

type AddedItem = {
  image: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
};

type NotifyAddedInput = {
  items: CartItem[];
  variantId: string;
  excludeProductId?: string;
};

type CartFeedbackContextValue = {
  notifyAdded: (input: NotifyAddedInput) => void;
};

const CartFeedbackContext = createContext<CartFeedbackContextValue | undefined>(undefined);

export function CartFeedbackProvider({ children }: { children: ReactNode }) {
  const { data: featured } = useFeaturedProducts();
  const [addedItem, setAddedItem] = useState<AddedItem | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState({ itemCount: 0, subtotalCents: 0 });
  const [excludeId, setExcludeId] = useState<string | null>(null);

  const notifyAdded = useCallback(({ items, variantId, excludeProductId }: NotifyAddedInput) => {
    const match = items.find((i) => i.variant.id === variantId);
    if (!match) return;
    setAddedItem({
      image: match.product.image,
      name: match.product.name,
      variantLabel: match.variant.size,
      quantity: match.quantity,
      unitPriceCents: match.product.priceCents,
    });
    setCartSnapshot({
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0),
    });
    setExcludeId(excludeProductId ?? match.product.id);
  }, []);

  const suggestion = featured?.items.find((p) => p.id !== excludeId) ?? null;

  return (
    <CartFeedbackContext.Provider value={{ notifyAdded }}>
      {children}
      {addedItem && (
        <AddedToCartModal
          open
          onClose={() => setAddedItem(null)}
          item={addedItem}
          itemCount={cartSnapshot.itemCount}
          subtotalCents={cartSnapshot.subtotalCents}
          suggestion={suggestion}
        />
      )}
    </CartFeedbackContext.Provider>
  );
}

export function useCartFeedback() {
  const ctx = useContext(CartFeedbackContext);
  if (!ctx) {
    throw new Error("useCartFeedback debe usarse dentro de CartFeedbackProvider");
  }
  return ctx;
}
