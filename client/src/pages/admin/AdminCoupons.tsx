import { useState, type FormEvent } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { couponCreateSchema } from "@shared/schemas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from "@/hooks/useAdmin";
import { formatDate, formatPrice } from "@/lib/utils";
import type { CouponType } from "@/types";

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: "Porcentaje",
  FIXED: "Monto fijo",
  FREE_SHIPPING: "Envio gratis",
};

export function AdminCoupons() {
  const { data, isLoading } = useAdminCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENT");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      code,
      type,
      value: type === "FREE_SHIPPING" ? 0 : type === "PERCENT" ? Number(value) : Math.round(Number(value) * 100),
      active: true,
      minPurchaseCents: minPurchase.trim() ? Math.round(Number(minPurchase) * 100) : 0,
      maxUses: maxUses.trim() ? Number(maxUses) : null,
      expiresAt: null,
    };

    const result = couponCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    await createCoupon.mutateAsync({
      ...result.data,
      active: result.data.active ?? true,
      minPurchaseCents: result.data.minPurchaseCents ?? 0,
      maxUses: result.data.maxUses ?? null,
      expiresAt: result.data.expiresAt ?? null,
    });
    setCode("");
    setValue("");
    setMinPurchase("");
    setMaxUses("");
  }

  return (
    <AdminLayout>
      <h1 className="mb-10 font-heading text-3xl tracking-wide text-ink">Cupones</h1>

      <form onSubmit={handleSubmit} className="mb-12 grid max-w-3xl gap-5 border border-border p-6 sm:grid-cols-2">
        <Input
          label="Codigo"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          error={errors.code}
          placeholder="BIENVENIDO10"
        />
        <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as CouponType)}>
          <option value="PERCENT">Porcentaje</option>
          <option value="FIXED">Monto fijo (ARS)</option>
          <option value="FREE_SHIPPING">Envio gratis</option>
        </Select>
        {type !== "FREE_SHIPPING" && (
          <Input
            label={type === "PERCENT" ? "Porcentaje (%)" : "Monto (ARS)"}
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={errors.value}
          />
        )}
        <Input
          label="Compra minima (ARS, opcional)"
          type="number"
          min="0"
          value={minPurchase}
          onChange={(e) => setMinPurchase(e.target.value)}
        />
        <Input
          label="Usos maximos (opcional)"
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={createCoupon.isPending}>
            <Plus className="h-4 w-4" />
            Crear cupon
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Tag} title="Sin cupones" description="Crea el primero con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest2 text-ink-dim">
              <tr>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 text-ink">{coupon.code}</td>
                  <td className="px-4 py-3 text-ink-muted">{TYPE_LABEL[coupon.type]}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {coupon.type === "PERCENT" ? `${coupon.value}%` : coupon.type === "FIXED" ? formatPrice(coupon.value) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {coupon.usesCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateCoupon.mutate({ id: coupon.id, input: { active: !coupon.active } })}>
                      <Badge tone={coupon.active ? "success" : "neutral"}>{coupon.active ? "Activo" : "Inactivo"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {confirmId === coupon.id ? (
                      <button
                        onClick={() => {
                          deleteCoupon.mutate(coupon.id);
                          setConfirmId(null);
                        }}
                        className="text-xs text-accent-hover underline"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button onClick={() => setConfirmId(coupon.id)} className="text-ink-muted hover:text-accent-hover">
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
