import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-3">
            <p className="font-display text-3xl text-ink">MLM</p>
            <p className="max-w-xs text-sm text-ink-muted">
              Prendas oscuras, cortes pesados y detalles bordados. Sin ruido, solo la marca.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest2 text-ink-dim">Contacto</p>
            <div className="flex flex-col gap-2 text-sm text-ink-muted">
              <a href="mailto:mlmclothess@gmail.com" className="hover:text-ink">
                mlmclothess@gmail.com
              </a>
              <a
                href="https://www.instagram.com/mlmclothess/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-ink"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
                @mlmclothess
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest2 text-ink-dim">Cuenta</p>
            <div className="flex flex-col gap-2 text-sm text-ink-muted">
              <Link to="/account/orders" className="hover:text-ink">
                Mis pedidos
              </Link>
              <Link to="/login" className="hover:text-ink">
                Iniciar sesion
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-16 text-[11px] uppercase tracking-widest2 text-ink-dim">
          MLM &copy; {new Date().getFullYear()} — Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
