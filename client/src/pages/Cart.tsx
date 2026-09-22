import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCoupon } from "@/context/CouponContext";
import { useToast } from "@/context/ToastContext";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useValidateCoupon } from "@/hooks/useCoupon";
import { useSettings } from "@/hooks/useSettings";
import { useShippingMethods } from "@/hooks/useShipping";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { ApiClientError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export function Cart() {
  const { user } = useAuth();
  const { data, isLoading } = useCart(Boolean(user));
  const { data: settings } = useSettings();
  const { data: shippingMethods } = useShippingMethods();
  const { coupon, setCoupon } = useCoupon();
  const validateCoupon = useValidateCoupon();
  const { push } = useToast();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Tu carrito esta vacio"
          description="Agrega algo de la coleccion para empezar."
          action={
            <Link to="/">
              <Button>Ver coleccion</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const subtotalCents = data?.subtotalCents ?? 0;
  const discountCents = coupon?.discountCents ?? 0;
  const freeShipping = coupon?.freeShipping ?? false;
  const shippingThreshold = settings?.freeShippingThresholdCents ?? null;
  const cheapestShippingCents =
    shippingMethods && shippingMethods.items.length > 0
      ? Math.min(...shippingMethods.items.map((m) => m.priceCents))
      : 0;
  const shippingCents =
    freeShipping || (shippingThreshold !== null && subtotalCents >= shippingThreshold) ? 0 : cheapestShippingCents;
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponInput.trim(), subtotalCents });
      setCoupon(result);
      push(`Cupon ${result.code} aplicado`, "success");
    } catch (error) {
      push(error instanceof ApiClientError ? error.message : "Cupon invalido", "error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-10 font-heading text-4xl tracking-wide text-ink">Carrito</h1>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-up flex gap-5 border-b border-border pb-8"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Link to={`/product/${item.product.slug}`} className="h-28 w-24 shrink-0 overflow-hidden bg-surface">
                <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={`/product/${item.product.slug}`} className="text-sm text-ink hover:underline">
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-widest2 text-ink-dim">
                      Talle {item.variant.size} · {item.variant.color}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm text-ink">{formatPrice(item.product.priceCents * item.quantity)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.variant.stock}
                    onChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                  />
                  <button
                    onClick={() => removeItem.mutate(item.id)}
                    className="text-ink-dim transition-colors hover:text-accent-hover"
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-4 border border-border p-6">
          <p className="text-xs uppercase tracking-widest2 text-ink-dim">Resumen</p>

          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Codigo de cupon"
              className="h-10 flex-1 border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-dim focus:border-border-strong focus:outline-none"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleApplyCoupon} loading={validateCoupon.isPending}>
              Aplicar
            </Button>
          </div>
          {coupon && (
            <div className="flex items-center justify-between text-xs text-success">
              <span>Cupon {coupon.code} aplicado</span>
              <button onClick={() => setCoupon(null)} className="underline">
                Quitar
              </button>
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-success">
                <span>Descuento</span>
                <span>-{formatPrice(discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-muted">
              <span>Envio</span>
              <span>{shippingCents === 0 ? "Gratis" : `desde ${formatPrice(shippingCents)}`}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-ink">
              <span>Total estimado</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
            <p className="text-xs text-ink-dim">El costo final de envio se define en el siguiente paso.</p>
          </div>

          <Link to="/checkout" className="block pt-2">
            <Button className="w-full">Ir a pagar</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
