import React from "react";
import { cn } from "../../lib/utils";

interface QuickDurationButtonsProps {
  value: number;
  onChange: (minutes: number) => void;
  options?: number[];
}

export const QuickDurationButtons: React.FC<QuickDurationButtonsProps> = ({
  value,
  onChange,
  options = [15, 30, 45, 60, 90, 120],
}) => (
  <div className="grid grid-cols-3 gap-2">
    {options.map((mins) => (
      <button
        key={mins}
        type="button"
        onClick={() => onChange(mins)}
        className={cn(
          "py-3 rounded-xl text-sm font-semibold border transition-all",
          value === mins
            ? "bg-primary text-white border-primary shadow-md"
            : "border-slate-200 dark:border-white/10 hover:border-primary/40"
        )}
      >
        {mins} dk
      </button>
    ))}
  </div>
);
