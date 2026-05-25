import React from "react";

interface DurationMinutesInputProps {
  value: number;
  onChange: (minutes: number) => void;
  label?: string;
}

export const DurationMinutesInput: React.FC<DurationMinutesInputProps> = ({
  value,
  onChange,
  label = "Süre (dakika)",
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">{label}</label>
    <input
      type="number"
      min={1}
      step={1}
      value={value > 0 ? value : ""}
      onChange={(e) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      }}
      placeholder="örn. 45"
      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
    />
  </div>
);
