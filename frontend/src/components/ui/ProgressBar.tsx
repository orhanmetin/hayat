import React from "react";
import { cn } from "../../lib/utils";

interface ProgressBarProps {
  label: string;
  current: number;
  target?: number;
  unit?: string;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  current,
  target,
  unit = "",
  colorClass = "bg-primary",
}) => {
  const pct = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-400">
          {current}
          {unit}
          {target ? ` / ${target}${unit}` : ""}
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
