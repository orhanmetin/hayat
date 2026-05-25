import React from "react";
import { cn } from "../../lib/utils";
import { formatDurationHoursMinutes } from "../../lib/duration";

interface ProgressBarProps {
  label: string;
  current: number;
  target?: number;
  unit?: string;
  periodLabel?: string;
  formatDuration?: boolean;
  colorClass?: string;
}

function formatValue(value: number, formatDuration: boolean, unit: string): string {
  if (formatDuration) return formatDurationHoursMinutes(value);
  return `${value}${unit}`;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  current,
  target,
  unit = "",
  periodLabel,
  formatDuration = false,
  colorClass = "bg-primary",
}) => {
  const pct = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start gap-2 text-xs">
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
          {periodLabel && (
            <span className="ml-2 text-slate-400 font-normal">({periodLabel})</span>
          )}
        </div>
        <span className="text-slate-400 text-right shrink-0">
          {formatValue(current, formatDuration, unit)}
          {target != null && target > 0
            ? ` / ${formatValue(target, formatDuration, unit)}`
            : ""}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
