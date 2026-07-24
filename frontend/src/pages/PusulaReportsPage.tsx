import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X as XIcon, Clock3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pusulaApi } from "../services/pusula";
import type {
  PusulaCategorySlice,
  PusulaDay,
  PusulaTrend,
} from "../types/pusula";
import { SegmentedControl } from "../components/dashboard/SegmentedControl";
import { cn } from "../lib/utils";

type Period = "weekly" | "monthly" | "yearly";
type Metric = "points" | "completion";
type ListMode = "day" | "week" | "month";

const PIE_COLORS = ["#5f7a61", "#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f43f5e"];

function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function addDaysIso(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

function rangeFor(mode: ListMode, anchor: string): { from: string; to: string } {
  if (mode === "day") return { from: anchor, to: anchor };
  if (mode === "week") {
    const d = new Date(`${anchor}T12:00:00`);
    const dow = d.getDay();
    const start = addDaysIso(anchor, dow === 0 ? -6 : 1 - dow);
    return { from: start, to: addDaysIso(start, 6) };
  }
  const d = new Date(`${anchor}T12:00:00`);
  const from = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("sv-SE");
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("sv-SE");
  return { from, to };
}

function periodRange(period: Period): { from: string; to: string } {
  const today = todayIso();
  if (period === "weekly") return rangeFor("week", today);
  if (period === "monthly") return rangeFor("month", today);
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: today };
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
};

export const PusulaReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>("weekly");
  const [metric, setMetric] = useState<Metric>("points");
  const [trend, setTrend] = useState<PusulaTrend | null>(null);
  const [slices, setSlices] = useState<PusulaCategorySlice[]>([]);
  const [listMode, setListMode] = useState<ListMode>("day");
  const [listAnchor, setListAnchor] = useState(todayIso());
  const [listDays, setListDays] = useState<PusulaDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrend = useCallback(async () => {
    setLoading(true);
    try {
      const range = periodRange(period);
      const [trendRes, sliceRes] = await Promise.all([
        pusulaApi.getTrend(period),
        pusulaApi.getCategoryDistribution(range.from, range.to),
      ]);
      setTrend(trendRes.data);
      setSlices(sliceRes.data);
      setError(null);
    } catch {
      setError("Rapor yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadList = useCallback(async () => {
    try {
      const { from, to } = rangeFor(listMode, listAnchor);
      const res = await pusulaApi.getDays(from, to);
      setListDays(res.data);
    } catch {
      setListDays([]);
    }
  }, [listMode, listAnchor]);

  useEffect(() => {
    void loadTrend();
  }, [loadTrend]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const listTasks = useMemo(
    () =>
      listDays.flatMap((d) =>
        d.tasks.map((t) => ({ ...t, dayDate: d.date }))
      ),
    [listDays]
  );

  const listTotals = useMemo(() => {
    const planned = listDays.reduce((s, d) => s + d.plannedPoints, 0);
    const earned = Math.round(listDays.reduce((s, d) => s + d.earnedPoints, 0) * 10) / 10;
    const total = listDays.reduce((s, d) => s + d.totalTasks, 0);
    const completed = listDays.reduce((s, d) => s + d.completedTasks, 0);
    return { planned, earned, total, completed };
  }, [listDays]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/pusula"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Pusula'ya dön"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pusula Raporları</h1>
          <p className="text-xs text-slate-400">Trend, kategori dağılımı ve görev listesi</p>
        </div>
      </div>

      {/* Trend */}
      <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">Trend</h2>
          <div className="flex flex-wrap gap-2">
            <SegmentedControl
              size="sm"
              ariaLabel="Dönem"
              options={[
                { id: "weekly", label: "Haftalık" },
                { id: "monthly", label: "Aylık" },
                { id: "yearly", label: "Yıllık" },
              ]}
              value={period}
              onChange={(v) => setPeriod(v)}
            />
            <SegmentedControl
              size="sm"
              ariaLabel="Metrik"
              options={[
                { id: "points", label: "Puan" },
                { id: "completion", label: "Tamamlama Oranı" },
              ]}
              value={metric}
              onChange={(v) => setMetric(v)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-12 text-sm text-slate-400">Yükleniyor…</p>
        ) : trend && trend.buckets.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {metric === "points" ? (
                <BarChart data={trend.buckets} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="plannedPoints"
                    name="Planlanan"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="earnedPoints"
                    name="Kazanılan"
                    fill="#5f7a61"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              ) : (
                <LineChart data={trend.buckets} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    width={40}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `%${v}`}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="completionPercent"
                    name="Görev Tamamlama %"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scorePercent"
                    name="Puan Başarı %"
                    stroke="#5f7a61"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center py-12 text-sm text-slate-400">Henüz veri yok.</p>
        )}
      </div>

      {/* Category distribution */}
      <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4">
        <h2 className="font-semibold text-sm mb-3">
          Kategori Dağılımı{" "}
          <span className="font-normal text-xs text-slate-400">
            (kazanılan puanlar,{" "}
            {period === "weekly" ? "bu hafta" : period === "monthly" ? "bu ay" : "bu yıl"})
          </span>
        </h2>
        {slices.length === 0 ? (
          <p className="text-center py-10 text-sm text-slate-400">Henüz kazanılan puan yok.</p>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="h-56 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="points"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {slices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-1.5">
              {slices.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="font-semibold">%{s.percent}</span>
                  <span className="text-xs text-slate-400 w-14 text-right">{s.points}p</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">Görev Listesi</h2>
          <div className="flex items-center gap-2">
            <SegmentedControl
              size="sm"
              ariaLabel="Liste dönemi"
              options={[
                { id: "day", label: "Gün" },
                { id: "week", label: "Hafta" },
                { id: "month", label: "Ay" },
              ]}
              value={listMode}
              onChange={(v) => setListMode(v)}
            />
            <input
              type="date"
              value={listAnchor}
              onChange={(e) => setListAnchor(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-white/10 bg-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          <span>
            Görev: <strong>{listTotals.completed}/{listTotals.total}</strong>
          </span>
          <span>
            Puan: <strong>{listTotals.earned}/{listTotals.planned}</strong>
          </span>
        </div>

        {listTasks.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-400">Bu dönemde görev yok.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {listTasks.map((t) => (
              <div key={`${t.id}-${t.dayDate}`} className="py-2.5 flex items-center gap-3">
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                    t.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : t.status === "notdone"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-slate-100 dark:bg-white/10 text-slate-400"
                  )}
                >
                  {t.status === "completed" ? (
                    <Check size={13} />
                  ) : t.status === "notdone" ? (
                    <XIcon size={13} />
                  ) : (
                    <Clock3 size={13} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm truncate",
                      t.status === "completed" && "line-through text-slate-400"
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(`${t.dayDate}T12:00:00`).toLocaleDateString("tr-TR")}
                    {t.categoryName ? ` · ${t.categoryName}` : ""} · P{t.priority}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  {t.earnedPoints}/{t.score}p
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
