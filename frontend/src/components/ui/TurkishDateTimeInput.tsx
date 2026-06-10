import React, { useEffect } from "react";
import { DatePickerTurkish } from "./DatePickerTurkish";
import { TimePickerDropdown } from "./TimePickerDropdown";
import { roundDateToMinuteStep } from "../../lib/format";
import { cn } from "../../lib/utils";

interface TurkishDateTimeInputProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  className?: string;
  minuteStep?: number;
}

export const TurkishDateTimeInput: React.FC<TurkishDateTimeInputProps> = ({
  label,
  value,
  onChange,
  className,
  minuteStep,
}) => {
  useEffect(() => {
    if (!minuteStep || minuteStep <= 1) return;
    const rounded = roundDateToMinuteStep(value, minuteStep);
    if (rounded.getTime() !== value.getTime()) onChange(rounded);
  }, [value, minuteStep, onChange]);

  const handleDateChange = (nextDate: Date) => {
    const merged = new Date(value);
    merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    onChange(minuteStep ? roundDateToMinuteStep(merged, minuteStep) : merged);
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const merged = new Date(value);
    merged.setHours(hours, minutes, 0, 0);
    onChange(minuteStep ? roundDateToMinuteStep(merged, minuteStep) : merged);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-slate-500">
        Takvimden gün.ay.yıl seçin · Saat listeden
        {minuteStep && minuteStep > 1 ? ` · Dakika ${minuteStep}'er dakika` : ""}
      </p>
      <DatePickerTurkish value={value} onChange={handleDateChange} />
      <TimePickerDropdown
        hours={value.getHours()}
        minutes={value.getMinutes()}
        onChange={handleTimeChange}
        minuteStep={minuteStep}
      />
    </div>
  );
};
