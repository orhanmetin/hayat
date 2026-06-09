import React, { useEffect, useMemo, useState } from "react";
import { habitsApi } from "../../services/modules";
import { SegmentedControl } from "../dashboard/SegmentedControl";
import { CountBarChart } from "./CountBarChart";
import type { HabitAnalytics, HabitTrendView } from "../../types/modules";

const TREND_VIEWS: { id: HabitTrendView; label: string; period: string; bucket: string }[] = [
  { id: "daily", label: "Günlük", period: "weekly", bucket: "daily" },
  { id: "weekly", label: "Haftalık", period: "monthly", bucket: "weekly" },
  { id: "monthly", label: "Aylık", period: "yearly", bucket: "monthly" },
];

interface HabitTrendPanelProps {
  habitId: number;
}

export const HabitTrendPanel: React.FC<HabitTrendPanelProps> = ({ habitId }) => {
  const [view, setView] = useState<HabitTrendView>("daily");
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const viewConfig = useMemo(
    () => TREND_VIEWS.find((v) => v.id === view) ?? TREND_VIEWS[0],
    [view]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    habitsApi
      .getAnalytics(habitId, viewConfig.period, viewConfig.bucket)
      .then((res) => {
        if (!cancelled) setAnalytics(res.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [habitId, viewConfig.period, viewConfig.bucket]);

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <SegmentedControl
          size="sm"
          options={TREND_VIEWS.map((v) => ({ id: v.id, label: v.label }))}
          value={view}
          onChange={setView}
          ariaLabel="Alışkanlık trend görünümü"
        />
        {analytics && (
          <p className="text-xs text-slate-500">
            Dönem toplamı: <span className="font-semibold">{analytics.periodTotal}</span>
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 text-sm py-6">Grafik yükleniyor...</p>
      ) : analytics && analytics.series.length > 0 ? (
        <CountBarChart data={analytics.series} />
      ) : (
        <p className="text-center text-slate-400 text-sm py-6">Bu dönemde kayıt yok.</p>
      )}
    </div>
  );
};
