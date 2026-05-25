import React from "react";
import { DatePickerTurkish } from "./DatePickerTurkish";
import { TimePickerDropdown } from "./TimePickerDropdown";
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
  const handleDateChange = (nextDate: Date) => {
    const merged = new Date(value);
    merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    onChange(merged);
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const merged = new Date(value);
    merged.setHours(hours, minutes, 0, 0);
    onChange(merged);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-slate-500">Takvimden gün.ay.yıl seçin · Saat listeden</p>
      <DatePickerTurkish value={value} onChange={handleDateChange} />
      <TimePickerDropdown
        hours={value.getHours()}
        minutes={value.getMinutes()}
        onChange={handleTimeChange}
      />
    </div>
  );
};
