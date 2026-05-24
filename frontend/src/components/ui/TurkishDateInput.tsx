import React, { useEffect, useState } from "react";
import {
  isoOrDateToTurkishInput,
  turkishDateToIso,
} from "../../lib/format";
import { cn } from "../../lib/utils";

interface TurkishDateInputProps {
  label: string;
  /** yyyy-MM-dd veya GG.AA.YYYY */
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
}

export const TurkishDateInput: React.FC<TurkishDateInputProps> = ({
  label,
  value,
  onChange,
  className,
}) => {
  const [display, setDisplay] = useState(() => isoOrDateToTurkishInput(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDisplay(isoOrDateToTurkishInput(value));
    setInvalid(false);
  }, [value]);

  const handleChange = (next: string) => {
    setDisplay(next);
    const iso = turkishDateToIso(next);
    if (iso) {
      setInvalid(false);
      onChange(iso);
    } else {
      setInvalid(next.length > 0);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="GG.AA.YYYY"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "w-full p-3 rounded-xl border bg-transparent text-base",
          invalid ? "border-red-400" : "border-slate-200 dark:border-white/10"
        )}
        aria-invalid={invalid}
      />
      {invalid && <p className="text-xs text-red-500">Örnek: 24.05.2026</p>}
    </div>
  );
};
