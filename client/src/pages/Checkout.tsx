import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft, MessageCircle, Wallet } from "lucide-react";
import { checkoutSchema } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { useCoupon } from "@/context/CouponContext";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/hooks/useCart";
import { useValidateCoupon } from "@/hooks/useCoupon";
import { useCheckout } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { useShippingMethods } from "@/hooks/useShipping";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApiClientError } from "@/lib/api";
import { classNames, formatPrice } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

function buildWhatsAppUrl(phone: string, orderId: string, totalCents: number) {
  const orderShort = orderId.slice(-8).toUpperCase();
  const text = `Hola! Quiero completar mi pedido #${orderShort} por ${formatPrice(totalCents)}.`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function Checkout() {
  const { user } = useAuth();
  const { data: cart, isLoading: loadingCart } = useCart(Boolean(user));
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: shippingMethodsData, isLoading: loadingShipping } = useShippingMethods();
  const { coupon, setCoupon } = useCoupon();
  const validateCoupon = useValidateCoupon();
  const checkout = useCheckout();
  const { push } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [form, setForm] = useState({
    shippingName: user?.address?.fullName ?? user?.name ?? "",
    shippingLine1: user?.address?.line1 ?? "",
    shippingCity: user?.address?.city ?? "",
    shippingProvince: user?.address?.province ?? "",
    shippingPostalCode: user?.address?.postalCode ?? "",
    shippingPhone: user?.address?.phone ?? "",
  });
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const shippingMethods = useMemo(
    () => (shippingMethodsData?.items ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [shippingMethodsData],
  );
  const selectedShippingMethod = shippingMethods.find((m) => m.id === shippingMethodId) ?? null;

  const availablePaymentMethods = useMemo(() => {
    const methods: PaymentMethod[] = [];
    if (settings?.naranjaXConfigured) methods.push("NARANJAX");
    if (settings?.bankAlias) methods.push("TRANSFER");
    if (settings?.whatsappPhone) methods.push("WHATSAPP");
    return methods;
  }, [settings]);

  const subtotalCents = cart?.subtotalCents ?? 0;
  const discountCents = coupon?.discountCents ?? 0;
  const freeShipping = coupon?.freeShipping ?? false;
  const methodPriceCents = selectedShippingMethod?.priceCents ?? 0;
  const shippingCents =
    freeShipping ||
    (settings?.freeShippingThresholdCents !== null &&
      settings?.freeShippingThresholdCents !== undefined &&
      subtotalCents >= settings.freeShippingThresholdCents)
      ? 0
      : methodPriceCents;
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

  function handleShippingSubmit(e: FormEvent) {
    e.preventDefault();
    const result = checkoutSchema
      .pick({
        shippingName: true,
        shippingLine1: true,
        shippingCity: true,
        shippingProvince: true,
        shippingPostalCode: true,
        shippingPhone: true,
      })
      .safeParse(form);

    const fieldErrors: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    }
    if (!shippingMethodId) {
      fieldErrors.shippingMethodId = "Elegi un metodo de envio";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (!paymentMethod) setPaymentMethod(availablePaymentMethods[0] ?? null);
    setStep("payment");
  }

  async function handleNaranjaXSubmit() {
    setPaymentError(null);
    setManualSubmitting(true);
    try {
      const { checkoutUrl } = await checkout.mutateAsync({
        ...form,
        shippingMethodId: shippingMethodId!,
        couponCode: coupon?.code,
        payment: { method: "NARANJAX" },
      });
      if (!checkoutUrl) throw new Error("Naranja X no devolvio la pagina de pago");
      setCoupon(null);
      window.location.assign(checkoutUrl);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "No se pudo iniciar el pago con Naranja X";
      setPaymentError(message);
      push(message, "error");
      setManualSubmitting(false);
    }
  }

  async function handleManualSubmit(method: "TRANSFER" | "WHATSAPP") {
    setPaymentError(null);
    setManualSubmitting(true);
    try {
      const { item } = await checkout.mutateAsync({
        ...form,
        shippingMethodId: shippingMethodId!,
        couponCode: coupon?.code,
        payment: { method },
      });
      setCoupon(null);
      if (method === "WHATSAPP" && settings?.whatsappPhone) {
        window.open(buildWhatsAppUrl(settings.whatsappPhone, item.id, item.totalCents), "_blank", "noopener");
      }
      navigate(`/orders/${item.id}`);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "No se pudo confirmar el pedido";
      setPaymentError(message);
      push(message, "error");
    } finally {
      setManualSubmitting(false);
    }
  }

  if (loadingCart || loadingSettings || loadingShipping) return <Spinner className="min-h-[60vh]" />;

  if (!cart || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  if (availablePaymentMethods.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <EmptyState
          icon={AlertTriangle}
          title="Pagos no configurados"
          description="El administrador todavia no conecto ningun medio de pago (Naranja X, transferencia o WhatsApp). No se puede finalizar la compra por ahora."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-10 font-heading text-4xl tracking-wide text-ink">Checkout</h1>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === "shipping" ? (
            <form onSubmit={handleShippingSubmit} className="space-y-5">
              <p className="text-xs uppercase tracking-widest2 text-ink-dim">Direccion de envio</p>
              <Input
                label="Nombre completo"
                value={form.shippingName}
                onChange={(e) => setForm((p) => ({ ...p, shippingName: e.target.value }))}
                error={errors.shippingName}
              />
              <Input
                label="Direccion"
                value={form.shippingLine1}
                onChange={(e) => setForm((p) => ({ ...p, shippingLine1: e.target.value }))}
                error={errors.shippingLine1}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Ciudad"
                  value={form.shippingCity}
                  onChange={(e) => setForm((p) => ({ ...p, shippingCity: e.target.value }))}
                  error={errors.shippingCity}
                />
                <Input
                  label="Provincia"
                  value={form.shippingProvince}
                  onChange={(e) => setForm((p) => ({ ...p, shippingProvince: e.target.value }))}
                  error={errors.shippingProvince}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Codigo postal"
                  value={form.shippingPostalCode}
                  onChange={(e) => setForm((p) => ({ ...p, shippingPostalCode: e.target.value }))}
                  error={errors.shippingPostalCode}
                />
                <Input
                  label="Telefono"
                  value={form.shippingPhone}
                  onChange={(e) => setForm((p) => ({ ...p, shippingPhone: e.target.value }))}
                  error={errors.shippingPhone}
                />
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <p className="text-xs uppercase tracking-widest2 text-ink-dim">Metodo de envio</p>
                {shippingMethods.length === 0 ? (
                  <p className="text-sm text-accent-hover">
                    El vendedor todavia no configuro metodos de envio. Contactalo para coordinar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shippingMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setShippingMethodId(method.id)}
                        className={classNames(
                          "flex w-full items-center justify-between gap-4 border px-4 py-3 text-left text-sm transition-colors",
                          method.id === shippingMethodId
                            ? "border-ink bg-elevated"
                            : "border-border hover:border-border-strong",
                        )}
                      >
                        <span>
                          <span className="text-ink">{method.name}</span>
                          {method.description && <span className="block text-xs text-ink-dim">{method.description}</span>}
                        </span>
                        <span className="whitespace-nowrap text-ink-muted">
                          {method.priceCents === 0 ? "A coordinar" : formatPrice(method.priceCents)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {errors.shippingMethodId && <p className="text-xs text-accent-hover">{errors.shippingMethodId}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Continuar al pago
              </Button>
            </form>
          ) : (
            <div className="animate-fade-up space-y-5">
              <button
                onClick={() => setStep("shipping")}
                className="flex items-center gap-1 text-xs uppercase tracking-widest2 text-ink-muted hover:text-ink"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a direccion
              </button>

              {availablePaymentMethods.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {availablePaymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={classNames(
                        "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
                        method === paymentMethod
                          ? "border-ink bg-ink text-bg"
                          : "border-border-strong text-ink hover:border-ink",
                      )}
                    >
                      {method === "NARANJAX" ? "Naranja X" : method === "TRANSFER" ? "Transferencia" : "WhatsApp"}
                    </button>
                  ))}
                </div>
              )}

              {paymentError && <p className="text-sm text-accent-hover">{paymentError}</p>}

              {paymentMethod === "NARANJAX" && (
                <div className="space-y-5 border border-border p-6">
                  <p className="text-xs uppercase tracking-widest2 text-ink-dim">Pago con Naranja X</p>
                  <p className="text-sm text-ink-muted">
                    Te llevamos a Naranja X para pagar <span className="text-ink">{formatPrice(totalCents)}</span> con tu
                    cuenta, tarjeta Naranja X o las cuotas disponibles. Al terminar volves a la tienda con tu pedido.
                  </p>
                  <Button className="w-full sm:w-auto" loading={manualSubmitting} onClick={handleNaranjaXSubmit}>
                    <Wallet className="h-4 w-4" />
                    Pagar con Naranja X
                  </Button>
                </div>
              )}

              {paymentMethod === "TRANSFER" && (
                <div className="space-y-5 border border-border p-6">
                  <p className="text-xs uppercase tracking-widest2 text-ink-dim">Transferencia bancaria</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-ink-muted">
                      Alias / CBU: <span className="text-ink">{settings?.bankAlias}</span>
                    </p>
                    {settings?.bankAccountHolder && (
                      <p className="text-ink-muted">
                        Titular: <span className="text-ink">{settings.bankAccountHolder}</span>
                      </p>
                    )}
                    <p className="text-ink-muted">
                      Monto a transferir: <span className="text-ink">{formatPrice(totalCents)}</span>
                    </p>
                  </div>
                  <p className="text-xs text-ink-dim">
                    Confirma el pedido y despues enviale el comprobante al vendedor. Tu pedido queda reservado como
                    pendiente hasta que se verifique el pago.
                  </p>
                  <Button
                    className="w-full sm:w-auto"
                    loading={manualSubmitting}
                    onClick={() => handleManualSubmit("TRANSFER")}
                  >
                    Confirmar pedido
                  </Button>
                </div>
              )}

              {paymentMethod === "WHATSAPP" && (
                <div className="space-y-5 border border-border p-6">
                  <p className="text-xs uppercase tracking-widest2 text-ink-dim">Completar por WhatsApp</p>
                  <p className="text-sm text-ink-muted">
                    Confirmamos tu pedido y te abrimos WhatsApp para coordinar el pago y el envio con el vendedor.
                  </p>
                  <Button
                    className="w-full sm:w-auto"
                    loading={manualSubmitting}
                    onClick={() => handleManualSubmit("WHATSAPP")}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Completar pedido por WhatsApp
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-fit space-y-4 border border-border p-6">
          <p className="text-xs uppercase tracking-widest2 text-ink-dim">Tu pedido</p>
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink-muted">
                {item.product.name} ({item.variant.size}) x{item.quantity}
              </span>
              <span className="text-ink">{formatPrice(item.product.priceCents * item.quantity)}</span>
            </div>
          ))}

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Codigo de cupon"
                disabled={step === "payment"}
                className="h-10 flex-1 border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-dim focus:border-border-strong focus:outline-none disabled:opacity-50"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleApplyCoupon}
                loading={validateCoupon.isPending}
                disabled={step === "payment"}
              >
                Aplicar
              </Button>
            </div>
            {coupon && (
              <div className="flex items-center justify-between text-xs text-success">
                <span>Cupon {coupon.code} aplicado</span>
                {step === "shipping" && (
                  <button onClick={() => setCoupon(null)} className="underline">
                    Quitar
                  </button>
                )}
              </div>
            )}
          </div>

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
              <span>Envio{selectedShippingMethod ? ` (${selectedShippingMethod.name})` : ""}</span>
              <span>
                {!selectedShippingMethod
                  ? "A elegir"
                  : shippingCents === 0
                    ? "Gratis"
                    : formatPrice(shippingCents)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-ink">
              <span>Total</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
