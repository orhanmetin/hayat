import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { dateToTurkishInput } from "../../lib/format";
import { cn } from "../../lib/utils";

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const WEEKDAYS_TR = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

interface DatePickerTurkishProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Pazartesi = 0 */
function mondayBasedWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export const DatePickerTurkish: React.FC<DatePickerTurkishProps> = ({
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMonth(startOfMonth(value));
  }, [value.getFullYear(), value.getMonth()]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = mondayBasedWeekday(new Date(year, month, 1));
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    const next = new Date(value);
    next.setFullYear(year, month, day);
    onChange(next);
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setViewMonth(new Date(year, month + delta, 1));
  };

  const isSelected = (day: number) =>
    value.getDate() === day &&
    value.getMonth() === month &&
    value.getFullYear() === year;

  const isToday = (day: number) => {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === month && t.getFullYear() === year;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-base text-left hover:border-primary/40 transition-colors"
      >
        <span className="font-medium">{dateToTurkishInput(value)}</span>
        <Calendar size={20} className="text-primary shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 right-0 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-bg-dark shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Önceki ay"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS_TR[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Sonraki ay"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
            {WEEKDAYS_TR.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) =>
              day === null ? (
                <span key={`e-${idx}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-medium transition-colors",
                    isSelected(day)
                      ? "bg-primary text-white"
                      : isToday(day)
                        ? "ring-1 ring-primary/50 hover:bg-primary/10"
                        : "hover:bg-slate-100 dark:hover:bg-white/10"
                  )}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
