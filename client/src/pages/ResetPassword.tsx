import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordSchema } from "@shared/schemas";
import { useToast } from "@/context/ToastContext";
import { useResetPassword } from "@/hooks/useAccount";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApiClientError } from "@/lib/api";
import { KeyRound } from "lucide-react";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { push } = useToast();
  const resetPassword = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <EmptyState
          icon={KeyRound}
          title="Link invalido"
          description="Falta el token para restablecer la contrasena. Pedi un nuevo link."
        />
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link to="/forgot-password" className="text-ink underline">
            Pedir un nuevo link
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }
    const result = resetPasswordSchema.safeParse({ token, newPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Datos invalidos");
      return;
    }
    setError(null);
    try {
      await resetPassword.mutateAsync(result.data);
      push("Contrasena actualizada, ya podes iniciar sesion", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo restablecer la contrasena");
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-display text-4xl text-ink">MLM</p>
      <h1 className="mt-6 font-heading text-3xl tracking-wide text-ink">Elegir nueva contrasena</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          label="Nueva contrasena"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirmar nueva contrasena"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" className="w-full" loading={resetPassword.isPending}>
          Guardar nueva contrasena
        </Button>
      </form>
    </div>
  );
}
