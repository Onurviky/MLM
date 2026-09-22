import { useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useProducts";
import { classNames } from "@/lib/utils";

export function Navbar() {
  const { user } = useAuth();
  const { data: cart } = useCart(Boolean(user));
  const { data: categoriesData } = useCategories();
  const [open, setOpen] = useState(false);
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeDropdown() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="relative mx-auto flex h-18 max-w-7xl items-center px-6">
        <div className="flex items-center gap-10 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
          <Link to="/" className="font-display text-2xl leading-none text-ink">
            MLM
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                classNames(
                  "text-xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink",
                  isActive && "text-ink",
                )
              }
            >
              Inicio
            </NavLink>

            <details ref={detailsRef} className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                Productos
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-1/2 top-full mt-3 w-48 -translate-x-1/2 border border-border-strong bg-elevated py-2 shadow-lg">
                <Link
                  to="/productos"
                  onClick={closeDropdown}
                  className="block px-4 py-2 text-xs uppercase tracking-widest2 text-ink-muted hover:bg-surface hover:text-ink"
                >
                  Ver todos los productos
                </Link>
                {categoriesData?.items.map((c) => (
                  <Link
                    key={c.id}
                    to={`/productos?category=${c.slug}`}
                    onClick={closeDropdown}
                    className="block px-4 py-2 text-xs uppercase tracking-widest2 text-ink-muted hover:bg-surface hover:text-ink"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>

            <Link
              to="/contacto"
              className="text-xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink"
            >
              Contacto
            </Link>
          </nav>
        </div>

        <button
          className="relative ml-6 h-4 w-6 shrink-0 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
        >
          <span
            className={classNames(
              "absolute left-0 h-0.5 w-6 bg-current transition-all duration-300 ease-editorial",
              open ? "top-[7px] rotate-45" : "top-0 rotate-0",
            )}
          />
          <span
            className={classNames(
              "absolute left-0 top-[7px] h-0.5 w-6 bg-current transition-opacity duration-200 ease-editorial",
              open && "opacity-0",
            )}
          />
          <span
            className={classNames(
              "absolute left-0 h-0.5 w-6 bg-current transition-all duration-300 ease-editorial",
              open ? "top-[7px] -rotate-45" : "top-[14px] rotate-0",
            )}
          />
        </button>

        <div className="ml-auto flex items-center gap-5">
          {user?.role === "ADMIN" && (
            <Link
              to="/admin/products"
              aria-label="Panel admin"
              className="hidden text-ink-muted transition-colors hover:text-ink lg:block"
            >
              <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          <Link
            to={user ? "/account/orders" : "/login"}
            aria-label="Cuenta"
            className="hidden text-ink-muted transition-colors hover:text-ink lg:block"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link to="/cart" aria-label="Carrito" className="relative text-ink-muted transition-colors hover:text-ink">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-accent text-[10px] font-semibold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div
        className={classNames(
          "overflow-hidden transition-[max-height] duration-[400ms] ease-editorial lg:hidden",
          open ? "max-h-[32rem] border-t border-border" : "max-h-0 border-t border-transparent",
        )}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className="py-2 text-sm uppercase tracking-widest2 text-ink-muted hover:text-ink"
          >
            Inicio
          </NavLink>
          <Link
            to="/productos"
            onClick={() => setOpen(false)}
            className="py-2 text-sm uppercase tracking-widest2 text-ink-muted hover:text-ink"
          >
            Productos
          </Link>
          {categoriesData?.items.map((c) => (
            <Link
              key={c.id}
              to={`/productos?category=${c.slug}`}
              onClick={() => setOpen(false)}
              className="py-2 pl-4 text-sm uppercase tracking-widest2 text-ink-dim hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
          <Link
            to="/contacto"
            onClick={() => setOpen(false)}
            className="py-2 text-sm uppercase tracking-widest2 text-ink-muted hover:text-ink"
          >
            Contacto
          </Link>
          <Link
            to={user ? "/account/orders" : "/login"}
            onClick={() => setOpen(false)}
            className="py-2 text-sm uppercase tracking-widest2 text-ink-muted hover:text-ink"
          >
            {user ? "Mi cuenta" : "Iniciar sesion"}
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              to="/admin/products"
              onClick={() => setOpen(false)}
              className="py-2 text-sm uppercase tracking-widest2 text-ink-muted hover:text-ink"
            >
              Panel admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
