import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { AccountTabs } from "@/components/layout/AccountTabs";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export function OrderHistory() {
  const { user } = useAuth();
  const { data, isLoading } = useMyOrders(Boolean(user));

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  const orders = data?.items ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-6 font-heading text-4xl tracking-wide text-ink">Mi cuenta</h1>
      <AccountTabs />

      {orders.length === 0 ? (
        <div className="animate-page-in">
          <EmptyState icon={Receipt} title="Sin pedidos todavia" description="Cuando compres algo va a aparecer aca." />
        </div>
      ) : (
        <div className="animate-page-in divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-ink">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-ink-dim">{formatDate(order.createdAt)}</p>
                {order.trackingCode && (
                  <p className="mt-1 text-xs text-ink-muted">Seguimiento: {order.trackingCode}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Badge tone={order.status === "CANCELLED" ? "accent" : "success"}>{STATUS_LABEL[order.status]}</Badge>
                <span className="text-sm text-ink">{formatPrice(order.totalCents)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
