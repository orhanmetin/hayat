import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { deepWorkApi, healthApi } from "../../services/modules";
import { DurationMinutesInput } from "../ui/DurationMinutesInput";
import { formatMinutes, parseApiDateTime } from "../../lib/format";
import {
  dateIsoFromStart,
  elapsedMinutesCeil,
} from "../../lib/activeTimerStorage";
import type { LookupType } from "../../types/modules";
import { cn } from "../../lib/utils";

export type TimerActivityKind = "deepwork" | "meditation";

interface ActiveTimerSaveModalProps {
  startTime: string;
  finishAt: string;
  deepWorkTypes: LookupType[];
  meditationTypes: LookupType[];
  onClose: () => void;
  onSaved: () => void;
}

export const ActiveTimerSaveModal: React.FC<ActiveTimerSaveModalProps> = ({
  startTime,
  finishAt,
  deepWorkTypes,
  meditationTypes,
  onClose,
  onSaved,
}) => {
  const [kind, setKind] = useState<TimerActivityKind>("deepwork");
  const [deepWorkTypeId, setDeepWorkTypeId] = useState(0);
  const [meditationTypeId, setMeditationTypeId] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(() =>
    elapsedMinutesCeil(startTime, finishAt)
  );
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deepWorkTypes[0]) setDeepWorkTypeId(deepWorkTypes[0].id);
  }, [deepWorkTypes]);

  useEffect(() => {
    const oturma = meditationTypes.find((t) => t.name === "Oturma");
    setMeditationTypeId(oturma?.id ?? meditationTypes[0]?.id ?? 0);
  }, [meditationTypes]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const logDate = dateIsoFromStart(startTime);
  const startedLabel = parseApiDateTime(startTime).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) {
      setError("Geçerli bir süre girin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (kind === "deepwork") {
        await deepWorkApi.create({
          deepWorkTypeId,
          date: logDate,
          durationMinutes,
          description: description.trim() || undefined,
        });
      } else {
        await healthApi.createMeditation({
          meditationTypeId,
          date: logDate,
          durationMinutes,
        });
      }
      onSaved();
    } catch {
      setError("Kayıt oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  const subtypeOptions = kind === "deepwork" ? deepWorkTypes : meditationTypes;
  const subtypeId = kind === "deepwork" ? deepWorkTypeId : meditationTypeId;
  const setSubtypeId = kind === "deepwork" ? setDeepWorkTypeId : setMeditationTypeId;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-timer-save-title"
        className="relative z-10 w-full max-w-lg rounded-t-3xl md:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 id="active-timer-save-title" className="font-semibold">
            Aktiviteyi Kaydet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs text-slate-500">Toplam süre</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {formatMinutes(durationMinutes)}
            </p>
            <p className="text-xs text-slate-500 mt-2">Başlangıç: {startedLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
            {(
              [
                { id: "deepwork" as const, label: "Deep Work" },
                { id: "meditation" as const, label: "Meditasyon" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKind(opt.id)}
                className={cn(
                  "py-2.5 rounded-lg text-sm font-semibold transition-all",
                  kind === opt.id
                    ? "bg-white dark:bg-black/40 shadow-sm text-primary"
                    : "text-slate-500"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Tür</label>
            <select
              value={subtypeId}
              onChange={(e) => setSubtypeId(Number(e.target.value))}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
            >
              {subtypeOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <DurationMinutesInput value={durationMinutes} onChange={setDurationMinutes} />

          {kind === "deepwork" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Açıklama (opsiyonel)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Not..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
