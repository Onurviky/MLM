import { NavLink } from "react-router-dom";
import { classNames } from "@/lib/utils";

const TABS = [
  { to: "/account/orders", label: "Mis pedidos" },
  { to: "/account/settings", label: "Mi cuenta" },
];

export function AccountTabs() {
  return (
    <div className="mb-10 flex gap-2 border-b border-border pb-4">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            classNames(
              "px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
              isActive ? "bg-ink text-bg" : "text-ink-muted hover:text-ink",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
