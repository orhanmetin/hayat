import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountBucketValue } from "../../types/modules";

interface CountBarChartProps {
  data: CountBucketValue[];
  color?: string;
}

interface TooltipEntry {
  value: number;
  payload: CountBucketValue;
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-slate-600 dark:text-slate-300">
        {count} kez
      </p>
    </div>
  );
};

export const CountBarChart: React.FC<CountBarChartProps> = ({
  data,
  color = "#5f7a61",
}) => (
  <div className="h-48">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "currentColor" }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "currentColor" }}
          width={32}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
