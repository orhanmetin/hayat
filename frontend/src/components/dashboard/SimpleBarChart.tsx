import React from "react";
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
import { formatDurationHoursMinutes } from "../../lib/duration";
import type { CardValueUnit } from "../../config/dashboard";
import type { TimeBucketValue } from "../../types/modules";

interface SimpleBarChartProps {
  data: TimeBucketValue[];
  color: string;
  /** Optional reference line value (target per day) */
  targetValue?: number | null;
  /** Reference line label (e.g. "Günlük hedef") */
  targetLabel?: string;
  unit?: CardValueUnit;
}

interface TooltipEntry {
  value: number;
  payload: TimeBucketValue;
}

const minutesTickFormatter = (v: number) => {
  if (v <= 0) return "0";
  if (v < 60) return `${v}m`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m === 0 ? `${h}sa` : `${h}sa${m}`;
};

const stepsTickFormatter = (v: number) => {
  if (v <= 0) return "0";
  if (v >= 1000) return `${Math.round(v / 100) / 10}b`;
  return String(Math.round(v));
};

function formatDisplay(value: number, unit: CardValueUnit): string {
  if (unit === "steps") return `${Math.round(value).toLocaleString("tr-TR")} adım`;
  return formatDurationHoursMinutes(value);
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  unit: CardValueUnit;
}> = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-slate-600 dark:text-slate-300">
        {formatDisplay(entry.value, unit)}
      </p>
    </div>
  );
};

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  color,
  targetValue,
  targetLabel,
  unit = "duration",
}) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "currentColor" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          tickFormatter={unit === "steps" ? stepsTickFormatter : minutesTickFormatter}
          width={48}
        />
        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ fill: "rgba(99,102,241,0.05)" }}
        />
        {targetValue != null && targetValue > 0 && (
          <ReferenceLine
            y={targetValue}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          >
            <Label
              value={`${targetLabel ?? "Hedef"}: ${formatDisplay(targetValue, unit)}`}
              position="insideTopRight"
              fill="#ef4444"
              fontSize={10}
            />
          </ReferenceLine>
        )}
        <Bar dataKey="minutes" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
