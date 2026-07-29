import type { FC } from "react";
import { cn } from "../../lib/utils";
import { formatDurationHoursMinutes } from "../../lib/duration";
import type { CardMeta, CardValueUnit } from "../../config/dashboard";
import type { CategoryBreakdownItem } from "../../types/modules";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  meta: CardMeta;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  primaryValue: number;
  primaryLabel: string;
  targetValue?: number | null;
  showTarget: boolean;
  breakdown?: CategoryBreakdownItem[];
}

function formatValue(value: number, unit: CardValueUnit): string {
  if (unit === "steps") return `${Math.round(value).toLocaleString("tr-TR")} adım`;
  return formatDurationHoursMinutes(value);
}

export const SummaryCard: FC<SummaryCardProps> = ({
  meta,
  icon: Icon,
  isActive,
  onClick,
  primaryValue,
  primaryLabel,
  targetValue,
  showTarget,
  breakdown,
}) => {
  const showTargetValue = showTarget && targetValue != null && targetValue > 0;
  const pct = showTargetValue && targetValue
    ? Math.min(100, Math.round((primaryValue / targetValue) * 100))
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "h-full w-full flex flex-col items-stretch text-left p-4 rounded-2xl border transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-primary/30",
        isActive
          ? "bg-white dark:bg-black/30 border-primary shadow-md ring-1 ring-primary/40"
          : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5"
      )}
    >
      <div className="flex items-start gap-3 min-h-[3.75rem] shrink-0">
        <div className={cn("p-2.5 rounded-xl shrink-0", meta.iconBg)}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase leading-tight">
            {meta.label}
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">
            {primaryLabel}
          </p>
        </div>
      </div>

      <div className="min-h-[3.5rem] shrink-0 space-y-1">
        <p className="text-xl font-bold leading-tight text-slate-800 dark:text-slate-100">
          {formatValue(primaryValue, meta.valueUnit)}
        </p>
        <p className="text-xs text-slate-500 min-h-[1.25rem] leading-snug">
          {showTarget ? (
            showTargetValue ? (
              <>
                Hedef:{" "}
                <span className="font-medium">
                  {formatValue(targetValue!, meta.valueUnit)}
                </span>
                {pct != null && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                    ({pct}%)
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400">Hedef tanımlı değil</span>
            )
          ) : (
            "\u00a0"
          )}
        </p>
      </div>

      <div
        className={cn(
          "shrink-0 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden",
          showTarget ? "mb-3" : "mb-0 invisible"
        )}
        aria-hidden={!showTarget}
      >
        {showTarget && showTargetValue && pct != null && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: meta.primaryColor }}
          />
        )}
      </div>

      {breakdown && breakdown.length > 0 ? (
        <ul className="mt-auto space-y-1.5 border-t border-slate-100 dark:border-white/5 pt-3">
          {breakdown.slice(0, 4).map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between text-xs gap-2"
            >
              <span className="text-slate-600 dark:text-slate-300 truncate">
                {item.name}
              </span>
              <span className="text-slate-500 font-medium shrink-0">
                {formatValue(item.minutes, meta.valueUnit === "steps" ? "steps" : "duration")}
              </span>
            </li>
          ))}
          {breakdown.length > 4 && (
            <li className="text-[10px] text-slate-400">
              +{breakdown.length - 4} daha…
            </li>
          )}
        </ul>
      ) : (
        <div className="mt-auto min-h-0" aria-hidden />
      )}
    </button>
  );
};
