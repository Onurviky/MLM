import { useState, type FormEvent } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { shippingMethodCreateSchema } from "@shared/schemas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import {
  useAdminShippingMethods,
  useCreateShippingMethod,
  useDeleteShippingMethod,
  useUpdateShippingMethod,
} from "@/hooks/useShipping";
import { formatPrice } from "@/lib/utils";

export function AdminShipping() {
  const { data, isLoading } = useAdminShippingMethods();
  const createMethod = useCreateShippingMethod();
  const updateMethod = useUpdateShippingMethod();
  const deleteMethod = useDeleteShippingMethod();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      description,
      priceCents: price.trim() ? Math.round(Number(price) * 100) : 0,
      active: true,
      sortOrder: data?.items.length ?? 0,
    };

    const result = shippingMethodCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    await createMethod.mutateAsync({
      ...result.data,
      description: result.data.description ?? "",
      active: result.data.active ?? true,
      sortOrder: result.data.sortOrder ?? 0,
    });
    setName("");
    setDescription("");
    setPrice("");
  }

  return (
    <AdminLayout>
      <h1 className="mb-2 font-heading text-3xl tracking-wide text-ink">Envios</h1>
      <p className="mb-10 text-sm text-ink-muted">
        Opciones de envio que el cliente elige en el checkout (cadeteria, correo a sucursal, coordinar por WhatsApp,
        etc.). Un metodo con costo $0 sirve para "a coordinar / a convenir".
      </p>

      <form onSubmit={handleSubmit} className="mb-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Cadeteria zona centrica"
        />
        <Input
          label="Costo (ARS)"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.priceCents}
          placeholder="0 para a coordinar"
        />
        <div className="sm:col-span-2">
          <Input
            label="Descripcion (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            placeholder="Entrega en 24-48hs habiles"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" loading={createMethod.isPending}>
            <Plus className="h-4 w-4" />
            Agregar metodo
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Truck} title="Sin metodos de envio" description="Agrega el primero con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest2 text-ink-dim">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((method) => (
                <tr key={method.id}>
                  <td className="px-4 py-3 text-ink">{method.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{method.description || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {method.priceCents === 0 ? "A coordinar" : formatPrice(method.priceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateMethod.mutate({ id: method.id, input: { active: !method.active } })}
                    >
                      <Badge tone={method.active ? "success" : "neutral"}>
                        {method.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {confirmId === method.id ? (
                      <button
                        onClick={() => {
                          deleteMethod.mutate(method.id);
                          setConfirmId(null);
                        }}
                        className="text-xs text-accent-hover underline"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button onClick={() => setConfirmId(method.id)} className="text-ink-muted hover:text-accent-hover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
