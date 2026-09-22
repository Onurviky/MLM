import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl text-ink">MLM</p>
      <h1 className="mt-6 font-heading text-3xl tracking-wide text-ink">Pagina no encontrada</h1>
      <p className="mt-2 text-sm text-ink-muted">El link al que intentaste acceder no existe.</p>
      <Link to="/" className="mt-8">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    </div>
  );
}
