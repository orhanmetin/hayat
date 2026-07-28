import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from "recharts";
import { ExternalLink } from "lucide-react";
import { racePrepApi } from "../../services/modules";
import type { RacePrepGoalDetail, RacePrepGoalKey } from "../../types/modules";
import { formatDurationHoursMinutes } from "../../lib/duration";
import { cn } from "../../lib/utils";

interface RacePrepGoalDetailPanelProps {
  goalKey: RacePrepGoalKey;
  accentColor: string;
}

function formatValue(value: number, unit: string): string {
  if (unit === "minutes") return formatDurationHoursMinutes(Math.round(value));
  if (unit === "count") return `${value % 1 === 0 ? value : value.toFixed(1)} kez`;
  if (unit === "km") return `${value % 1 === 0 ? value : value.toFixed(1)} km`;
  return String(value);
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}> = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-slate-600 dark:text-slate-300">
        {formatValue(payload[0].value, unit)}
      </p>
    </div>
  );
};

export const RacePrepGoalDetailPanel: React.FC<RacePrepGoalDetailPanelProps> = ({
  goalKey,
  accentColor,
}) => {
  const [detail, setDetail] = useState<RacePrepGoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    racePrepApi
      .getGoalDetail(goalKey)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Detay yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [goalKey]);

  if (loading) {
    return <p className="text-center text-slate-400 text-sm py-6">Yükleniyor…</p>;
  }

  if (error || !detail) {
    return <p className="text-center text-red-500 text-sm py-6">{error ?? "Detay yok."}</p>;
  }

  if (detail.mode === "trend") {
    if (detail.trend.length === 0) {
      return (
        <p className="text-center text-slate-400 text-sm py-6">
          Bu hedef için henüz trend verisi yok.
        </p>
      );
    }

    const yTick =
      detail.unit === "minutes"
        ? (v: number) => {
            if (v <= 0) return "0";
            if (v < 60) return `${v}m`;
            const h = Math.floor(v / 60);
            const m = v % 60;
            return m === 0 ? `${h}sa` : `${h}sa${m}`;
          }
        : (v: number) =>
            detail.unit === "count" ? String(v) : `${v % 1 === 0 ? v : v.toFixed(1)}`;

    return (
      <div className="h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={detail.trend} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "currentColor" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "currentColor" }}
              tickFormatter={yTick}
              width={44}
              allowDecimals={detail.unit !== "count"}
            />
            <Tooltip
              content={<ChartTooltip unit={detail.unit} />}
              cursor={{ fill: "rgba(99,102,241,0.05)" }}
            />
            {detail.targetValue != null && detail.targetValue > 0 && (
              <ReferenceLine
                y={detail.targetValue}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              >
                <Label
                  value={`Hedef: ${formatValue(detail.targetValue, detail.unit)}`}
                  position="insideTopRight"
                  fill="#ef4444"
                  fontSize={10}
                />
              </ReferenceLine>
            )}
            <Bar dataKey="value" fill={accentColor} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (detail.items.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-6">
        {goalKey === "visualization"
          ? "Görselleştirme manuel sayaçtır; ayrı aktivite listesi tutulmaz."
          : "Bu hedef için henüz kayıt yok."}
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-64 overflow-y-auto">
      {detail.items.map((item, index) => (
        <div
          key={`${item.dateLabel}-${item.title}-${index}`}
          className="py-2.5 flex items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-orange-500 hover:text-orange-600 shrink-0"
                  aria-label="Strava'da aç"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {item.dateLabel}
              {item.subtitle ? ` · ${item.subtitle}` : ""}
            </p>
          </div>
          {item.value != null && (
            <span
              className={cn(
                "text-xs font-bold shrink-0 tabular-nums",
                "text-slate-600 dark:text-slate-300"
              )}
            >
              {formatValue(item.value, item.unit ?? detail.unit)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
