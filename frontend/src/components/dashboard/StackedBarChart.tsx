import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDurationHoursMinutes } from "../../lib/duration";
import { CATEGORY_COLORS } from "../../config/dashboard";
import type { StackedSeries } from "../../types/modules";
import { cn } from "../../lib/utils";

interface StackedBarChartProps {
  series: StackedSeries;
}

interface ChartRow {
  key: string;
  label: string;
  total: number;
  [category: string]: string | number;
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

const minutesTickFormatter = (v: number) => {
  if (v <= 0) return "0";
  if (v < 60) return `${v}m`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m === 0 ? `${h}sa` : `${h}sa${m}`;
};

const StackedTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, p) => acc + p.value, 0);
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs shadow-md max-w-[220px]">
      <p className="font-semibold mb-1">{label}</p>
      <ul className="space-y-1">
        {sorted.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 truncate">{entry.name}</span>
            <span className="text-slate-500">
              {formatDurationHoursMinutes(entry.value)}
            </span>
          </li>
        ))}
      </ul>
      {sorted.length > 1 && (
        <p className="text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5">
          Toplam: <strong>{formatDurationHoursMinutes(total)}</strong>
        </p>
      )}
    </div>
  );
};

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ series }) => {
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    () => new Set()
  );

  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    series.categories.forEach((cat, idx) => {
      map[cat] = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
    });
    return map;
  }, [series.categories]);

  const data = useMemo<ChartRow[]>(() => {
    return series.buckets.map((b) => {
      const row: ChartRow = { key: b.key, label: b.label, total: b.total };
      series.categories.forEach((cat) => {
        row[cat] = hiddenCategories.has(cat) ? 0 : b.segments[cat] ?? 0;
      });
      return row;
    });
  }, [series.buckets, series.categories, hiddenCategories]);

  const toggleCategory = (cat: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (series.categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        Bu dönemde kayıt yok.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "currentColor" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickFormatter={minutesTickFormatter}
              width={48}
            />
            <Tooltip
              content={<StackedTooltip />}
              cursor={{ fill: "rgba(99,102,241,0.05)" }}
            />
            {series.categories.map((cat, idx, arr) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="activity"
                fill={categoryColors[cat]}
                radius={idx === arr.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={48}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Alt türler">
        {series.categories.map((cat) => {
          const hidden = hiddenCategories.has(cat);
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-pressed={!hidden}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-opacity",
                  hidden
                    ? "opacity-40 border-slate-200 dark:border-white/10"
                    : "border-slate-200 dark:border-white/10"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: categoryColors[cat] }}
                />
                {cat}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
