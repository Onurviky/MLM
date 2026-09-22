import { useState, type FormEvent } from "react";
import { addressSchema, passwordChangeSchema, profileUpdateSchema } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useChangePassword, useUpdateAddress, useUpdateProfile } from "@/hooks/useAccount";
import { AccountTabs } from "@/components/layout/AccountTabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiClientError } from "@/lib/api";

function fieldErrorsFrom(error: unknown, fallback: Record<string, string> = {}): Record<string, string> {
  if (error instanceof ApiClientError && error.errors) {
    const mapped: Record<string, string> = {};
    for (const issue of error.errors) mapped[issue.path] = issue.message;
    return mapped;
  }
  return fallback;
}

export function AccountSettings() {
  const { user, setUser } = useAuth();
  const { push } = useToast();

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateAddress = useUpdateAddress();

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [addressForm, setAddressForm] = useState({
    fullName: user?.address?.fullName ?? "",
    line1: user?.address?.line1 ?? "",
    city: user?.address?.city ?? "",
    province: user?.address?.province ?? "",
    postalCode: user?.address?.postalCode ?? "",
    phone: user?.address?.phone ?? "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    const result = profileUpdateSchema.safeParse(profileForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    try {
      const { user: updated } = await updateProfile.mutateAsync(result.data);
      setUser(updated);
      push("Datos actualizados", "success");
    } catch (error) {
      setProfileErrors(fieldErrorsFrom(error));
      push(error instanceof ApiClientError ? error.message : "No se pudieron guardar los datos", "error");
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Las contrasenas no coinciden" });
      return;
    }
    const result = passwordChangeSchema.safeParse({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});
    try {
      await changePassword.mutateAsync(result.data);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      push("Contrasena actualizada", "success");
    } catch (error) {
      push(error instanceof ApiClientError ? error.message : "No se pudo cambiar la contrasena", "error");
    }
  }

  async function handleAddressSubmit(e: FormEvent) {
    e.preventDefault();
    const result = addressSchema.safeParse(addressForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});
    try {
      const { user: updated } = await updateAddress.mutateAsync(result.data);
      setUser(updated);
      push("Direccion guardada", "success");
    } catch (error) {
      setAddressErrors(fieldErrorsFrom(error));
      push(error instanceof ApiClientError ? error.message : "No se pudo guardar la direccion", "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 font-heading text-4xl tracking-wide text-ink">Mi cuenta</h1>
      <AccountTabs />

      <div className="animate-page-in space-y-14">
        <section>
          <p className="mb-5 text-xs uppercase tracking-widest2 text-ink-dim">Datos personales</p>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <Input
              label="Nombre"
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              error={profileErrors.name}
            />
            <Input
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              error={profileErrors.email}
            />
            <Button type="submit" loading={updateProfile.isPending}>
              Guardar datos
            </Button>
          </form>
        </section>

        <section>
          <p className="mb-5 text-xs uppercase tracking-widest2 text-ink-dim">Direccion de envio</p>
          <form onSubmit={handleAddressSubmit} className="space-y-5">
            <Input
              label="Nombre completo"
              value={addressForm.fullName}
              onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
              error={addressErrors.fullName}
            />
            <Input
              label="Direccion"
              value={addressForm.line1}
              onChange={(e) => setAddressForm((p) => ({ ...p, line1: e.target.value }))}
              error={addressErrors.line1}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Ciudad"
                value={addressForm.city}
                onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                error={addressErrors.city}
              />
              <Input
                label="Provincia"
                value={addressForm.province}
                onChange={(e) => setAddressForm((p) => ({ ...p, province: e.target.value }))}
                error={addressErrors.province}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Codigo postal"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))}
                error={addressErrors.postalCode}
              />
              <Input
                label="Telefono"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                error={addressErrors.phone}
              />
            </div>
            <Button type="submit" loading={updateAddress.isPending}>
              Guardar direccion
            </Button>
          </form>
        </section>

        <section>
          <p className="mb-5 text-xs uppercase tracking-widest2 text-ink-dim">Cambiar contrasena</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <Input
              label="Contrasena actual"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              error={passwordErrors.currentPassword}
            />
            <Input
              label="Nueva contrasena"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              error={passwordErrors.newPassword}
            />
            <Input
              label="Confirmar nueva contrasena"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              error={passwordErrors.confirmPassword}
            />
            <Button type="submit" loading={changePassword.isPending}>
              Cambiar contrasena
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
