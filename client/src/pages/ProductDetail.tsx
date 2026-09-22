import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useCartFeedback } from "@/context/CartFeedbackContext";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SizeSelector } from "@/components/product/SizeSelector";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { formatPrice } from "@/lib/utils";

export function ProductDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useProduct(slug);
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const { push } = useToast();
  const addToCart = useAddToCart();
  const { notifyAdded } = useCartFeedback();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setSelectedVariantId(null);
    setQuantity(1);
    setActiveImage(0);
  }, [slug]);

  if (isLoading) return <Spinner className="min-h-[60vh]" />;
  if (!data) return null;

  const product = data.item;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const hasDiscount = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.priceCents / product.compareAtPriceCents!) * 100)
    : 0;
  const maxInstallments = settings?.maxInstallments ?? 1;
  const installmentAmount = maxInstallments > 1 ? Math.round(product.priceCents / maxInstallments) : 0;

  function handleAddToCart() {
    if (!user) {
      push("Iniciar sesion para agregar al carrito", "error");
      return;
    }
    if (!selectedVariant) {
      push("Elegi un talle primero", "error");
      return;
    }
    addToCart.mutate(
      { variantId: selectedVariant.id, quantity },
      {
        onSuccess: (data) => {
          notifyAdded({ items: data.items, variantId: selectedVariant.id, excludeProductId: product.id });
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/5] overflow-hidden bg-surface">
            <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-16 overflow-hidden border ${i === activeImage ? "border-ink" : "border-border"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-6">
          <p className="text-xs uppercase tracking-widest2 text-ink-dim">{product.category.name}</p>
          <h1 className="mt-2 font-heading text-4xl tracking-wide text-ink">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-2xl text-ink">{formatPrice(product.priceCents)}</p>
            {hasDiscount && (
              <>
                <span className="text-base text-ink-dim line-through">{formatPrice(product.compareAtPriceCents!)}</span>
                <Badge tone="accent">-{discountPercent}%</Badge>
              </>
            )}
          </div>
          {maxInstallments > 1 && (
            <p className="mt-2 text-xs text-ink-muted">
              hasta {maxInstallments}x {formatPrice(installmentAmount)} con tarjeta de credito
            </p>
          )}

          <p className="mt-8 max-w-lg text-sm leading-relaxed text-ink-muted">{product.description}</p>

          <div className="mt-10 space-y-3">
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">Talle</p>
            <SizeSelector
              variants={product.variants}
              selectedId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
            {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
              <p className="text-xs text-accent-hover">Quedan {selectedVariant.stock} unidades</p>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <QuantityStepper value={quantity} onChange={setQuantity} max={selectedVariant?.stock ?? 20} />
            <Button className="flex-1" onClick={handleAddToCart} loading={addToCart.isPending}>
              Agregar al carrito
            </Button>
          </div>

          {!user && (
            <p className="mt-4 text-xs text-ink-dim">
              <Link to="/login" className="underline hover:text-ink">
                Inicia sesion
              </Link>{" "}
              para comprar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
