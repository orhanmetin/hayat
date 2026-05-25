import React from "react";
import { cn } from "../../lib/utils";
import type { GoalPeriod } from "../../config/weeklyGoals";

interface DurationHoursMinutesInputProps {
  label: string;
  period: GoalPeriod;
  periodLabel: string;
  description?: string;
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
}

export const DurationHoursMinutesInput: React.FC<DurationHoursMinutesInputProps> = ({
  label,
  period,
  periodLabel,
  description,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
}) => (
  <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-medium px-2 py-1 rounded-full",
          period === "weekly"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-primary/10 text-primary"
        )}
      >
        {periodLabel}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500">Saat</label>
        <input
          type="number"
          min={0}
          max={period === "weekly" ? 999 : 24}
          value={hours || ""}
          onChange={(e) => onHoursChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          placeholder="0"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500">Dakika</label>
        <input
          type="number"
          min={0}
          max={59}
          value={minutes || ""}
          onChange={(e) =>
            onMinutesChange(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))
          }
          placeholder="0"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
        />
      </div>
    </div>
  </div>
);
