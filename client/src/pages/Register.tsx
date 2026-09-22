import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = registerSchema.safeParse({ name, email, password });
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
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-display text-4xl text-ink">MLM</p>
      <h1 className="mt-6 font-heading text-3xl tracking-wide text-ink">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input
          label="Contrasena"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {formError && <p className="text-sm text-accent-hover">{formError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-muted">
        Ya tenes cuenta?{" "}
        <Link to="/login" className="text-ink underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
  );
}
