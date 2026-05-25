import React from "react";
import { cn } from "../../lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

interface TimePickerDropdownProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  className?: string;
}

export const TimePickerDropdown: React.FC<TimePickerDropdownProps> = ({
  hours,
  minutes,
  onChange,
  className,
}) => (
  <div className={cn("flex gap-2", className)}>
    <select
      value={hours}
      onChange={(e) => onChange(Number(e.target.value), minutes)}
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
      value={minutes}
      onChange={(e) => onChange(hours, Number(e.target.value))}
      className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-base appearance-none cursor-pointer"
      aria-label="Dakika"
    >
      {MINUTES.map((m) => (
        <option key={m} value={m}>
          {String(m).padStart(2, "0")}
        </option>
      ))}
    </select>
  </div>
);
