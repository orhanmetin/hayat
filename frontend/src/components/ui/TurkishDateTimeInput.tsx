import React, { useEffect, useState } from "react";
import {
  dateToTurkishInput,
  parseTurkishDateTime,
  timeToTurkishInput,
} from "../../lib/format";
import { cn } from "../../lib/utils";

interface TurkishDateTimeInputProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  className?: string;
}

export const TurkishDateTimeInput: React.FC<TurkishDateTimeInputProps> = ({
  label,
  value,
  onChange,
  className,
}) => {
  const [dateStr, setDateStr] = useState(() => dateToTurkishInput(value));
  const [timeStr, setTimeStr] = useState(() => timeToTurkishInput(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDateStr(dateToTurkishInput(value));
    setTimeStr(timeToTurkishInput(value));
    setInvalid(false);
  }, [value]);

  const tryEmit = (nextDate: string, nextTime: string) => {
    setDateStr(nextDate);
    setTimeStr(nextTime);
    const parsed = parseTurkishDateTime(nextDate, nextTime);
    if (parsed) {
      setInvalid(false);
      onChange(parsed);
    } else {
      setInvalid(nextDate.length > 0 || nextTime.length > 0);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-slate-500">Gün.Ay.Yıl · Saat (24 saat, örn. 23:00)</p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="GG.AA.YYYY"
          value={dateStr}
          onChange={(e) => tryEmit(e.target.value, timeStr)}
          className={cn(
            "flex-1 p-3 rounded-xl border bg-transparent text-base",
            invalid
              ? "border-red-400"
              : "border-slate-200 dark:border-white/10"
          )}
          aria-invalid={invalid}
        />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="SS:DD"
          value={timeStr}
          onChange={(e) => tryEmit(dateStr, e.target.value)}
          className={cn(
            "w-24 p-3 rounded-xl border bg-transparent text-base text-center",
            invalid
              ? "border-red-400"
              : "border-slate-200 dark:border-white/10"
          )}
          aria-invalid={invalid}
        />
      </div>
      {invalid && (
        <p className="text-xs text-red-500">Örnek: 20.05.2026 ve 23:00</p>
      )}
    </div>
  );
};
