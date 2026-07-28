import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Footprints, Smartphone, Settings2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { digitalApi } from "../services/modules";
import type { DigitalOverview } from "../types/modules";
import { formatDurationHoursMinutes } from "../lib/duration";
import { cn } from "../lib/utils";

function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function addDaysIso(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

const tooltipStyle = { fontSize: 12, borderRadius: 8 };

export const DigitalPage: React.FC = () => {
  const [to, setTo] = useState(todayIso);
  const from = useMemo(() => addDaysIso(to, -6), [to]);
  const [data, setData] = useState<DigitalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await digitalApi.getOverview(from, to);
      setData(res.data);
      setError(null);
      if (res.data.screenTime.length > 0) {
        setSelectedDay((prev) =>
          prev && res.data.screenTime.some((d) => d.date === prev)
            ? prev
            : res.data.screenTime[res.data.screenTime.length - 1]?.date ?? null
        );
      } else {
        setSelectedDay(null);
      }
    } catch {
      setError("Dijital veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const stepChart = useMemo(
    () =>
      (data?.steps ?? []).map((s) => ({
        label: shortDate(s.date),
        steps: s.steps,
        date: s.date,
      })),
    [data]
  );

  const screenChart = useMemo(
    () =>
      (data?.screenTime ?? []).map((d) => ({
        label: shortDate(d.date),
        minutes: d.totalMinutes,
        date: d.date,
      })),
    [data]
  );

  const selectedSummary = data?.screenTime.find((d) => d.date === selectedDay) ?? null;
  const avgSteps =
    stepChart.length > 0
      ? Math.round(stepChart.reduce((s, x) => s + x.steps, 0) / stepChart.length)
      : 0;
  const avgScreen =
    screenChart.length > 0
      ? Math.round(screenChart.reduce((s, x) => s + x.minutes, 0) / screenChart.length)
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dijital</h1>
          <p className="text-sm text-slate-500 mt-1">
            Apple Health adımları ve Screen Time uygulama süreleri (Shortcuts ile)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-white/10 bg-transparent"
            aria-label="Bitiş tarihi"
          />
          <Link
            to="/management/shortcuts"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            <Settings2 size={14} />
            Shortcuts
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Aralık: {shortDate(from)} – {shortDate(to)} (son 7 gün)
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-center py-16 text-slate-400 text-sm">Yükleniyor…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Steps */}
          <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Footprints size={18} />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm">Adımlar</h2>
                <p className="text-[11px] text-slate-400">
                  Ort. {avgSteps.toLocaleString("tr-TR")} adım/gün
                </p>
              </div>
            </div>
            {stepChart.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">
                Henüz adım kaydı yok. Shortcuts ile aktarın.
              </p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stepChart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      width={40}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${Math.round(v / 1000)}b` : String(v)
                      }
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="steps" name="Adım" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Screen time totals */}
          <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm">Ekran Süresi</h2>
                <p className="text-[11px] text-slate-400">
                  Ort. {formatDurationHoursMinutes(avgScreen)} / gün
                </p>
              </div>
            </div>
            {screenChart.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">
                Henüz ekran süresi yok. Shortcuts ile aktarın.
              </p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={screenChart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      width={40}
                      tickFormatter={(v: number) => `${Math.round(v / 60)}sa`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) =>
                        formatDurationHoursMinutes(Number(value ?? 0))
                      }
                    />
                    <Bar
                      dataKey="minutes"
                      name="Dakika"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* App breakdown */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-sm">Uygulama kırılımı</h2>
              {data && data.screenTime.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.screenTime.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDay(d.date)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                        selectedDay === d.date
                          ? "bg-violet-500 text-white border-violet-500"
                          : "border-slate-200 dark:border-white/10 text-slate-500"
                      )}
                    >
                      {shortDate(d.date)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!selectedSummary ? (
              <p className="text-center py-8 text-sm text-slate-400">
                Gün seçin veya Shortcuts ile veri gönderin.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  {shortDate(selectedSummary.date)} toplam:{" "}
                  <strong className="text-slate-600 dark:text-slate-200">
                    {formatDurationHoursMinutes(selectedSummary.totalMinutes)}
                  </strong>
                </p>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {selectedSummary.topApps.map((app) => {
                    const pct =
                      selectedSummary.totalMinutes > 0
                        ? Math.round((app.minutes * 100) / selectedSummary.totalMinutes)
                        : 0;
                    return (
                      <div key={`${app.appName}-${app.kind}`} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{app.appName}</p>
                            {app.kind === "website" && (
                              <span className="text-[10px] text-slate-400">web</span>
                            )}
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            {formatDurationHoursMinutes(app.minutes)}
                          </p>
                          <p className="text-[10px] text-slate-400">%{pct}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
