import { useState } from "react";
import { Receipt, Send } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  NARANJAX: "Naranja X",
  MERCADOPAGO: "Mercado Pago",
  TRANSFER: "Transferencia",
  WHATSAPP: "WhatsApp",
};

function TrackingCell({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const [code, setCode] = useState(order.trackingCode ?? "");

  function handleSend() {
    if (!code.trim()) return;
    updateStatus.mutate({ id: order.id, status: "SHIPPED", trackingCode: code.trim() });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Codigo Correo Argentino"
        className="h-9 w-44"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={handleSend}
        loading={updateStatus.isPending}
        disabled={!code.trim() || code.trim() === (order.trackingCode ?? "")}
        title="Guardar y enviar por mail al cliente"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function AdminOrders() {
  const { data, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  return (
    <AdminLayout>
      <h1 className="mb-10 font-heading text-3xl tracking-wide text-ink">Pedidos</h1>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin pedidos" description="Todavia no se registraron compras." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest2 text-ink-dim">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Seguimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-ink">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {order.user?.name}
                    <br />
                    <span className="text-xs text-ink-dim">{order.user?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatPrice(order.totalCents)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={order.paymentMethod === "NARANJAX" ? "neutral" : "accent"}>
                      {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
                      }
                      className="h-9 w-40"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <TrackingCell order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
