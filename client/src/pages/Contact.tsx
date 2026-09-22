import { useState, type FormEvent } from "react";
import { Clock, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { classNames } from "@/lib/utils";

type FormState = { name: string; email: string; message: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const { push } = useToast();
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Ingresa tu nombre";
    if (!EMAIL_RE.test(form.email)) nextErrors.email = "Ingresa un email valido";
    if (!form.message.trim()) nextErrors.message = "Escribi tu mensaje";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const subject = encodeURIComponent(`Consulta de ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:mlmclothess@gmail.com?subject=${subject}&body=${body}`;
    push("Abriendo tu cliente de correo...", "success");
  }

  return (
    <div className="animate-page-in mx-auto max-w-5xl px-6 py-24">
      <div className="mb-16 text-center">
        <p className="text-xs uppercase tracking-widest3 text-ink-dim">Hablemos</p>
        <h1 className="mt-4 font-heading text-4xl tracking-wide text-ink sm:text-5xl">Contacto</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">
          Consultas sobre pedidos, talles o mayorista. Escribinos y te respondemos a la brevedad.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-ink-dim" strokeWidth={1.5} />
            <div>
              <p className="text-xs uppercase tracking-widest2 text-ink-dim">Email</p>
              <a href="mailto:mlmclothess@gmail.com" className="mt-1 block text-sm text-ink-muted hover:text-ink">
                mlmclothess@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Instagram className="h-5 w-5 text-ink-dim" strokeWidth={1.5} />
            <div>
              <p className="text-xs uppercase tracking-widest2 text-ink-dim">Instagram</p>
              <a
                href="https://www.instagram.com/mlmclothess/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm text-ink-muted hover:text-ink"
              >
                @mlmclothess
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="h-5 w-5 text-ink-dim" strokeWidth={1.5} />
            <div>
              <p className="text-xs uppercase tracking-widest2 text-ink-dim">Horario</p>
              <p className="mt-1 text-sm text-ink-muted">Lunes a viernes, 10 a 18hs</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label="Nombre"
            name="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-xs uppercase tracking-widest2 text-ink-muted">
              Mensaje
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className={classNames(
                "w-full border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-dim focus:outline-none",
                errors.message ? "border-accent" : "border-border focus:border-border-strong",
              )}
            />
            {errors.message && <p className="text-xs text-accent-hover">{errors.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Enviar mensaje
          </Button>
        </form>
      </div>
    </div>
  );
}
