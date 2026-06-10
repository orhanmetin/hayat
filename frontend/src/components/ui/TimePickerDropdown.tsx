import React, { useMemo } from "react";
import { cn } from "../../lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimePickerDropdownProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  className?: string;
  minuteStep?: number;
}

export const TimePickerDropdown: React.FC<TimePickerDropdownProps> = ({
  hours,
  minutes,
  onChange,
  className,
  minuteStep = 1,
}) => {
  const minuteOptions = useMemo(() => {
    if (minuteStep <= 1) return Array.from({ length: 60 }, (_, i) => i);
    return Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);
  }, [minuteStep]);

  const displayMinutes = useMemo(() => {
    if (minuteStep <= 1) return minutes;
    return minuteOptions.reduce(
      (best, m) => (Math.abs(m - minutes) < Math.abs(best - minutes) ? m : best),
      minuteOptions[0]
    );
  }, [minuteOptions, minutes, minuteStep]);

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        value={hours}
        onChange={(e) => onChange(Number(e.target.value), displayMinutes)}
        className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-base appearance-none cursor-pointer"
        aria-label="Saat"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="flex items-center text-slate-400 font-medium">:</span>
      <select
        value={displayMinutes}
        onChange={(e) => onChange(hours, Number(e.target.value))}
        className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-base appearance-none cursor-pointer"
        aria-label="Dakika"
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
};
