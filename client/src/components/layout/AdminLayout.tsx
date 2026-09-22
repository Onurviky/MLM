import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Layers, LogOut, Package, Receipt, Settings, Tag, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { classNames } from "@/lib/utils";

const LINKS = [
  { to: "/admin/products", label: "Productos", icon: Package },
  { to: "/admin/collections", label: "Colecciones", icon: Layers },
  { to: "/admin/orders", label: "Pedidos", icon: Receipt },
  { to: "/admin/coupons", label: "Cupones", icon: Tag },
  { to: "/admin/shipping", label: "Envios", icon: Truck },
  { to: "/admin/settings", label: "Configuracion", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 border-r border-border p-6 lg:block">
        <Link to="/" className="font-display text-2xl text-ink">
          MLM
        </Link>
        <p className="mt-1 text-[10px] uppercase tracking-widest2 text-ink-dim">Panel admin</p>

        <nav className="mt-10 flex flex-col gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                classNames(
                  "flex items-center gap-3 px-3 py-2.5 text-sm uppercase tracking-widest2 text-ink-muted transition-colors hover:bg-elevated hover:text-ink",
                  isActive && "bg-elevated text-ink",
                )
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => logout()}
          className="mt-10 flex items-center gap-3 px-3 py-2.5 text-sm uppercase tracking-widest2 text-ink-muted transition-colors hover:text-accent-hover"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Salir
        </button>
      </aside>

      <div className="flex-1 px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
