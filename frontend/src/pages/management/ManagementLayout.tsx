import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Target, Layers } from "lucide-react";
import { cn } from "../../lib/utils";

const sections = [
  { to: "/management/goals", label: "Hedef Yönetimi", icon: Target },
  { to: "/management/activity-types", label: "Aktivite Türleri", icon: Layers },
] as const;

export const ManagementLayout: React.FC = () => (
  <div className="space-y-6 max-w-xl mx-auto">
    <div>
      <h1 className="text-2xl font-bold">Yönetim</h1>
      <p className="text-sm text-slate-500 mt-1">
        Hedefler ve aktivite türleri ayrı bölümlerde yönetilir
      </p>
    </div>

    <nav
      className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5"
      aria-label="Yönetim bölümleri"
    >
      {sections.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "py-2.5 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
              isActive
                ? "bg-white dark:bg-black/40 shadow-sm text-primary"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )
          }
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{label.split(" ")[0]}</span>
        </NavLink>
      ))}
    </nav>

    <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 min-h-[320px]">
      <Outlet />
    </div>
  </div>
);
