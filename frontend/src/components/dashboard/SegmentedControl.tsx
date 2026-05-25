import { cn } from "../../lib/utils";

interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-grid gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5",
        `grid-cols-${options.length}`
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-lg font-medium transition-colors whitespace-nowrap",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            value === option.id
              ? "bg-white dark:bg-black/40 shadow-sm text-primary"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
