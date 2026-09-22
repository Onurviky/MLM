import { useEffect, useState, type FormEvent } from "react";
import { settingsUpdateSchema } from "@shared/schemas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useAdminSettings, useUpdateSettings } from "@/hooks/useAdmin";
import { useSettings } from "@/hooks/useSettings";

export function AdminSettings() {
  const { data, isLoading } = useAdminSettings();
  const { data: publicSettings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [maxInstallments, setMaxInstallments] = useState("1");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [bankAlias, setBankAlias] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.item) {
      setMaxInstallments(String(data.item.maxInstallments));
      setFreeShippingThreshold(
        data.item.freeShippingThresholdCents !== null ? String(data.item.freeShippingThresholdCents / 100) : "",
      );
      setWhatsappPhone(data.item.whatsappPhone ?? "");
      setBankAlias(data.item.bankAlias ?? "");
      setBankAccountHolder(data.item.bankAccountHolder ?? "");
    }
  }, [data]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      maxInstallments: Number(maxInstallments),
      freeShippingThresholdCents: freeShippingThreshold.trim() ? Math.round(Number(freeShippingThreshold) * 100) : null,
      whatsappPhone: whatsappPhone.trim() || null,
      bankAlias: bankAlias.trim() || null,
      bankAccountHolder: bankAccountHolder.trim() || null,
    };

    const result = settingsUpdateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await updateSettings.mutateAsync({
      ...result.data,
      freeShippingThresholdCents: result.data.freeShippingThresholdCents ?? null,
      whatsappPhone: result.data.whatsappPhone ?? null,
      bankAlias: result.data.bankAlias ?? null,
      bankAccountHolder: result.data.bankAccountHolder ?? null,
    });
  }

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  return (
    <AdminLayout>
      <h1 className="mb-4 font-heading text-3xl tracking-wide text-ink">Configuracion</h1>

      <div className="mb-10">
        <Badge tone={publicSettings?.naranjaXConfigured ? "success" : "accent"}>
          Naranja X: {publicSettings?.naranjaXConfigured ? "conectado" : "sin configurar (falta NX_API_KEY)"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6 border border-border p-6">
        <Input
          label="Cuotas maximas a mostrar (Naranja X)"
          type="number"
          min="1"
          max="24"
          value={maxInstallments}
          onChange={(e) => setMaxInstallments(e.target.value)}
          error={errors.maxInstallments}
        />
        <p className="-mt-4 text-xs text-ink-dim">
          Se muestra en la ficha de cada producto. Las cuotas disponibles al pagar las define Naranja X, no la tienda.
        </p>

        <Input
          label="Envio gratis a partir de (ARS, opcional)"
          type="number"
          min="0"
          value={freeShippingThreshold}
          onChange={(e) => setFreeShippingThreshold(e.target.value)}
          error={errors.freeShippingThresholdCents}
          placeholder="Dejar vacio para no aplicar"
        />
        <p className="-mt-4 text-xs text-ink-dim">
          Las tarifas de cada metodo de envio (cadeteria, correo, etc.) se cargan en la seccion "Envios" del menu.
        </p>

        <div className="space-y-5 border-t border-border pt-6">
          <p className="text-xs uppercase tracking-widest2 text-ink-dim">Pago manual (sin Naranja X)</p>
          <Input
            label="WhatsApp para completar pedidos (opcional)"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            error={errors.whatsappPhone}
            placeholder="5491122334455"
          />
          <Input
            label="Alias o CBU para transferencia (opcional)"
            value={bankAlias}
            onChange={(e) => setBankAlias(e.target.value)}
            error={errors.bankAlias}
            placeholder="mlm.store.mp"
          />
          <Input
            label="Titular de la cuenta (opcional)"
            value={bankAccountHolder}
            onChange={(e) => setBankAccountHolder(e.target.value)}
            error={errors.bankAccountHolder}
            placeholder="MLM Store SRL"
          />
          <p className="-mt-2 text-xs text-ink-dim">
            Si cargas alguno de estos datos, en el checkout aparece esa opcion como alternativa a pagar con tarjeta.
          </p>
        </div>

        <Button type="submit" loading={updateSettings.isPending}>
          Guardar cambios
        </Button>
      </form>
    </AdminLayout>
  );
}
