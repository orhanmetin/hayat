import React from "react";
import { DatePickerTurkish } from "./DatePickerTurkish";
import { isoOrDateToTurkishInput, turkishDateToIso } from "../../lib/format";
import { cn } from "../../lib/utils";

interface TurkishDateInputProps {
  label: string;
  /** yyyy-MM-dd */
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
  const dateValue = (() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
    const parts = isoOrDateToTurkishInput(value);
    const m = parts.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0);
    return new Date();
  })();

  const handleChange = (d: Date) => {
    const iso = turkishDateToIso(
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
    );
    if (iso) onChange(iso);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <DatePickerTurkish value={dateValue} onChange={handleChange} />
    </div>
  );
};
