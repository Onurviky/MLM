import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginSchema } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-display text-4xl text-ink">MLM</p>
      <h1 className="mt-6 font-heading text-3xl tracking-wide text-ink">Iniciar sesion</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input
          label="Contrasena"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <p className="text-right">
          <Link to="/forgot-password" className="text-xs text-ink-muted underline hover:text-ink">
            Olvidaste tu contrasena?
          </Link>
        </p>
        {formError && <p className="text-sm text-accent-hover">{formError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Ingresar
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-dim">
        Demo: cliente@mlm.com / cliente1234 &middot; admin@mlm.com / admin1234
      </p>

      <p className="mt-8 text-sm text-ink-muted">
        No tenes cuenta?{" "}
        <Link to="/register" className="text-ink underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
