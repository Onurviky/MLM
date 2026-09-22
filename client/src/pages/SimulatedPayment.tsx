import { useNavigate, useParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useOrder, useSimulatePayment } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ApiClientError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

// Reemplaza la pagina de pago de Naranja X mientras el server corre con NX_SIMULATE=true.
export function SimulatedPayment() {
  const { id } = useParams();
  const { data, isLoading } = useOrder(id);
  const simulate = useSimulatePayment();
  const { push } = useToast();
  const navigate = useNavigate();

  async function handleResult(approve: boolean) {
    try {
      await simulate.mutateAsync({ id: id!, approve });
      navigate(`/orders/${id}`, { replace: true });
    } catch (error) {
      push(error instanceof ApiClientError ? error.message : "No se pudo simular el pago", "error");
    }
  }

  if (isLoading) return <Spinner className="min-h-[60vh]" />;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <Wallet className="mx-auto h-10 w-10 text-ink" strokeWidth={1.25} />
      <p className="mt-6 text-xs uppercase tracking-widest2 text-accent-hover">Modo prueba</p>
      <h1 className="mt-2 font-heading text-3xl tracking-wide text-ink">Pago simulado Naranja X</h1>
      <p className="mt-4 text-sm text-ink-muted">
        Aca iria la pagina de pago de Naranja X. Total del pedido:{" "}
        <span className="text-ink">{formatPrice(data.item.totalCents)}</span>
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button loading={simulate.isPending} onClick={() => handleResult(true)}>
          Aprobar pago
        </Button>
        <Button variant="secondary" disabled={simulate.isPending} onClick={() => handleResult(false)}>
          Rechazar pago
        </Button>
      </div>
    </div>
  );
}
