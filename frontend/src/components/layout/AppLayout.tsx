import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { AppLogo } from "../ui/AppLogo";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/log", label: "Olaylar", icon: PlusCircle },
  { to: "/habits", label: "Alışkanlıklar", icon: CheckSquare },
  { to: "/management", label: "Yönetim", icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-medium",
      isActive
        ? "bg-primary/10 dark:bg-primary-light/10 text-primary dark:text-primary-light"
        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5"
    );

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-col items-center gap-1 text-[10px] font-medium",
      isActive ? "text-primary dark:text-primary-light" : "text-slate-400 dark:text-slate-500"
    );

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300 font-sans pb-16 md:pb-0">
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-black/30 border-r border-slate-200 dark:border-white/5 flex-col shrink-0">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
          <AppLogo size="md" />
          <span className="text-xl font-bold tracking-tight">hayat</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm">
              {user?.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 text-sm font-medium"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-bg-dark/70 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:hidden">
            <AppLogo size="sm" />
            <span className="text-lg font-bold">hayat</span>
          </div>
          <h2 className="hidden md:block text-lg font-semibold text-slate-800 dark:text-emerald-300">
            Hayat Takibi
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Temayı değiştir"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={logout}
              className="md:hidden p-2.5 rounded-full hover:bg-red-500/10 text-red-500"
              aria-label="Çıkış"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-bg-dark/95 border-t border-slate-200 dark:border-white/5 flex items-center justify-around z-50 backdrop-blur-md">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={mobileLinkClass}>
            <item.icon size={20} />
            <span>{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
