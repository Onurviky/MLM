import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, MessageCircle, XCircle } from "lucide-react";
import { useSyncPayment } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatPrice } from "@/lib/utils";

function buildWhatsAppUrl(phone: string, orderId: string, totalCents: number) {
  const orderShort = orderId.slice(-8).toUpperCase();
  const text = `Hola! Quiero completar mi pedido #${orderShort} por ${formatPrice(totalCents)}.`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export function OrderConfirmation() {
  const { id } = useParams();
  // Al volver de Naranja X, esta consulta verifica el estado real del pago antes de mostrar el pedido.
  const { data, isLoading } = useSyncPayment(id);
  const { data: settings } = useSettings();

  if (isLoading) return <Spinner className="min-h-[60vh]" />;
  if (!data) return null;

  const order = data.item;
  const awaitingNaranjaX = order.paymentMethod === "NARANJAX" && order.status === "PENDING";
  const rejectedNaranjaX = order.paymentMethod === "NARANJAX" && order.status === "CANCELLED";
  const HeaderIcon = awaitingNaranjaX ? Clock : rejectedNaranjaX ? XCircle : CheckCircle2;
  const title = awaitingNaranjaX ? "Esperando tu pago" : rejectedNaranjaX ? "El pago no se completo" : "Pedido confirmado";

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="flex flex-col items-center text-center">
        <HeaderIcon className={`h-10 w-10 ${rejectedNaranjaX ? "text-accent-hover" : "text-success"}`} strokeWidth={1.25} />
        <h1 className="mt-6 font-heading text-4xl tracking-wide text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Numero de pedido: {order.id}</p>
        <div className="mt-4">
          <Badge tone={order.status === "CANCELLED" ? "accent" : "success"}>{STATUS_LABEL[order.status]}</Badge>
        </div>
      </div>

      <div className="mt-12 space-y-6 border border-border p-6">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-ink-muted">
              {item.productName} ({item.size}) x{item.quantity}
            </span>
            <span className="text-ink">{formatPrice(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-success">
              <span>Descuento {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-muted">
            <span>Envio{order.shippingMethodName ? ` (${order.shippingMethodName})` : ""}</span>
            <span>{order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-ink">
            <span>Total{order.installments > 1 ? ` (${order.installments} cuotas)` : ""}</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {awaitingNaranjaX && (
        <div className="mt-6 border border-border p-6 text-sm text-ink-muted">
          <p className="mb-3 text-xs uppercase tracking-widest2 text-ink-dim">Pago en Naranja X</p>
          Todavia no recibimos la confirmacion de Naranja X. Si ya pagaste, el pedido se actualiza solo en unos
          minutos; recarga esta pagina para ver el estado.
        </div>
      )}

      {rejectedNaranjaX && (
        <div className="mt-6 border border-border p-6 text-center text-sm">
          <p className="mb-4 text-ink-muted">
            Naranja X no aprobo el pago, asi que el pedido quedo cancelado. Tus productos siguen en el carrito.
          </p>
          <Link to="/checkout">
            <Button variant="secondary">Intentar de nuevo</Button>
          </Link>
        </div>
      )}

      {order.paymentMethod === "TRANSFER" && order.status === "PENDING" && (
        <div className="mt-6 border border-border p-6 text-sm">
          <p className="mb-3 text-xs uppercase tracking-widest2 text-ink-dim">Falta confirmar tu pago</p>
          <p className="text-ink-muted">
            Transferi <span className="text-ink">{formatPrice(order.totalCents)}</span> al alias/CBU{" "}
            <span className="text-ink">{settings?.bankAlias}</span>
            {settings?.bankAccountHolder ? ` (${settings.bankAccountHolder})` : ""} y enviale el comprobante al
            vendedor. Tu pedido queda reservado, pero el estado va a decir "Pendiente" hasta que se verifique el pago.
          </p>
        </div>
      )}

      {order.paymentMethod === "WHATSAPP" && order.status === "PENDING" && (
        <div className="mt-6 border border-border p-6 text-center text-sm">
          <p className="mb-3 text-xs uppercase tracking-widest2 text-ink-dim">Falta coordinar tu pedido</p>
          <p className="mb-4 text-ink-muted">Termina de coordinar el pago y el envio por WhatsApp con el vendedor.</p>
          {settings?.whatsappPhone && (
            <a
              href={buildWhatsAppUrl(settings.whatsappPhone, order.id, order.totalCents)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </Button>
            </a>
          )}
        </div>
      )}

      {order.trackingCode && (
        <div className="mt-6 border border-border p-6 text-center">
          <p className="text-xs uppercase tracking-widest2 text-ink-dim">Codigo de seguimiento (Correo Argentino)</p>
          <p className="mt-2 font-heading text-2xl tracking-widest text-ink">{order.trackingCode}</p>
          <a
            href="https://www.correoargentino.com.ar/seguimiento"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs uppercase tracking-widest2 text-ink-muted underline hover:text-ink"
          >
            Rastrear envio
          </a>
        </div>
      )}

      <div className="mt-6 border border-border p-6 text-sm text-ink-muted">
        <p className="mb-2 text-xs uppercase tracking-widest2 text-ink-dim">Envio a</p>
        <p className="text-ink">{order.shippingName}</p>
        <p>{order.shippingLine1}</p>
        <p>
          {order.shippingCity}, {order.shippingProvince} ({order.shippingPostalCode})
        </p>
        <p>{order.shippingPhone}</p>
        <p className="mt-2 text-xs text-ink-dim">Realizado el {formatDate(order.createdAt)}</p>
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/">
          <Button variant="secondary">Seguir comprando</Button>
        </Link>
      </div>
    </div>
  );
}
