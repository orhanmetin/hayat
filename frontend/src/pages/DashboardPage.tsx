import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  MoonStar,
  Activity,
  Brain,
  Trophy,
  Sparkles,
  Flower2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardApi } from "../services/modules";
import { formatMinutes } from "../lib/format";
import type { DashboardAnalytics, DashboardSummary } from "../types/modules";
import { cn } from "../lib/utils";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, a] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getAnalytics(period),
        ]);
        setSummary(s.data);
        setAnalytics(a.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const stats = [
    {
      label: "Uyku",
      value: formatMinutes(summary?.lastNightSleepMinutes ?? 0),
      icon: MoonStar,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Spor (Bugün)",
      value: formatMinutes(summary?.todaySportMinutes ?? 0),
      icon: Activity,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Deep Work",
      value: formatMinutes(summary?.todayDeepWorkMinutes ?? 0),
      icon: Brain,
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Alışkanlık Serisi",
      value: `${summary?.habitStreakBest ?? 0} gün`,
      sub: `${summary?.habitsCompletedToday ?? 0}/${summary?.totalHabits ?? 0} bugün`,
      icon: Trophy,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 dark:border-white/5">
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary-dark dark:text-primary-light">
            <Sparkles size={12} />
            Hoş Geldiniz
          </span>
          <h1 className="text-2xl md:text-3xl font-bold">Merhaba, {user?.displayName}!</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Günlük, haftalık ve aylık özetleriniz burada. Veri girilmeyen günler grafikte 0 olarak gösterilir.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 flex items-center gap-4 hover-lift"
              >
                <div className={cn("p-3 rounded-xl", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-400">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  {"sub" in stat && stat.sub && (
                    <span className="text-[10px] text-emerald-500">{stat.sub}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                  period === p
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 dark:border-white/10"
                )}
              >
                {p === "weekly" ? "Haftalık" : "Aylık"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analytics?.charts.map((chart) => (
              <div
                key={chart.title}
                className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5"
              >
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Flower2 size={16} className="text-primary" />
                  {chart.title}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart.points}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#5f7a61" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
