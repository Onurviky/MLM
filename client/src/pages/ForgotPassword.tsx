import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "@shared/schemas";
import { useForgotPassword } from "@/hooks/useAccount";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiClientError } from "@/lib/api";

export function ForgotPassword() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Email invalido");
      return;
    }
    setError(null);
    try {
      await forgotPassword.mutateAsync(result.data);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo procesar el pedido");
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-display text-4xl text-ink">MLM</p>
      <h1 className="mt-6 font-heading text-3xl tracking-wide text-ink">Recuperar contrasena</h1>

      {sent ? (
        <p className="mt-8 text-sm text-ink-muted">
          Si el email existe en nuestro sistema, vas a recibir instrucciones para restablecer tu contrasena.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <p className="text-sm text-ink-muted">
            Ingresa tu email y te enviamos un link para elegir una nueva contrasena.
          </p>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
          <Button type="submit" className="w-full" loading={forgotPassword.isPending}>
            Enviar instrucciones
          </Button>
        </form>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        <Link to="/login" className="text-ink underline">
          Volver a iniciar sesion
        </Link>
      </p>
    </div>
  );
}
