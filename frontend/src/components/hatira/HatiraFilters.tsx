import React, { useState } from "react";
import { Filter, X } from "lucide-react";
import { TurkishDateInput } from "../ui/TurkishDateInput";
import type { HatiraFilterOptions, HatiraListParams } from "../../types/modules";
import { cn } from "../../lib/utils";

interface HatiraFiltersProps {
  value: HatiraListParams;
  options: HatiraFilterOptions;
  onChange: (next: HatiraListParams) => void;
}

export const HatiraFilters: React.FC<HatiraFiltersProps> = ({
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const activeCount = [value.from, value.to, value.companion, value.location].filter(
    Boolean
  ).length;

  const clear = () => onChange({});

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border",
          open || activeCount > 0
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
        )}
      >
        <Filter size={16} />
        Filtrele
        {activeCount > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1 rounded-md bg-primary text-white text-xs flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
          <TurkishDateInput
            label="Başlangıç"
            value={value.from ?? ""}
            onChange={(from) => onChange({ ...value, from: from || undefined })}
          />
          <TurkishDateInput
            label="Bitiş"
            value={value.to ?? ""}
            onChange={(to) => onChange({ ...value, to: to || undefined })}
          />

          <label className="block space-y-2 text-sm">
            <span className="font-medium">Kişi (Companion)</span>
            <input
              list="hatira-companions"
              value={value.companion ?? ""}
              onChange={(e) =>
                onChange({ ...value, companion: e.target.value.trim() || undefined })
              }
              placeholder="Örn. Ayşe"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
            />
            <datalist id="hatira-companions">
              {options.companions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium">Lokasyon / mekan adı</span>
            <input
              list="hatira-locations"
              value={value.location ?? ""}
              onChange={(e) =>
                onChange({ ...value, location: e.target.value.trim() || undefined })
              }
              placeholder="Örn. Karaköy"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
            />
            <datalist id="hatira-locations">
              {options.locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clear}
              className="sm:col-span-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
            >
              <X size={14} />
              Filtreleri temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
};
