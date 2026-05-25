import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { healthApi } from "../../services/modules";
import { TurkishDateTimeInput } from "../ui/TurkishDateTimeInput";
import { formatDateTime } from "../../lib/format";
import type { SleepLog } from "../../types/modules";
import { cn } from "../../lib/utils";

interface SleepEntryFormProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type SleepMode = "bed" | "wake";

export const SleepEntryForm: React.FC<SleepEntryFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [mode, setMode] = useState<SleepMode>("bed");
  const [openSleep, setOpenSleep] = useState<SleepLog | null>(null);
  const [loadingOpen, setLoadingOpen] = useState(true);

  const [bedDateTime, setBedDateTime] = useState(() => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    return d;
  });
  const [wakeDateTime, setWakeDateTime] = useState(() => new Date());
  const [quality, setQuality] = useState(4);
  const [note, setNote] = useState("");
  const [includeWakeNow, setIncludeWakeNow] = useState(false);
  const [wakeTimeTouched, setWakeTimeTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultWakeFromBed = (bed: Date) => new Date(bed.getTime() + 7 * 60 * 60 * 1000);

  const loadOpen = async () => {
    setLoadingOpen(true);
    try {
      const res = await healthApi.getOpenSleep();
      setOpenSleep(res.data);
      if (res.data) setMode("wake");
    } catch {
      setOpenSleep(null);
    } finally {
      setLoadingOpen(false);
    }
  };

  useEffect(() => {
    loadOpen();
  }, []);

  useEffect(() => {
    if (openSleep) {
      setWakeDateTime(defaultWakeFromBed(new Date(openSleep.bedTime)));
      setWakeTimeTouched(false);
    }
  }, [openSleep]);

  const handleIncludeWakeNowChange = (checked: boolean) => {
    setIncludeWakeNow(checked);
    if (checked && !wakeTimeTouched) {
      setWakeDateTime(defaultWakeFromBed(bedDateTime));
    }
  };

  const handleBedDateTimeChange = (next: Date) => {
    setBedDateTime(next);
    if (includeWakeNow && !wakeTimeTouched) {
      setWakeDateTime(defaultWakeFromBed(next));
    }
  };

  const handleWakeDateTimeChange = (next: Date) => {
    setWakeTimeTouched(true);
    setWakeDateTime(next);
  };

  const sleepApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
    const msg = axiosErr.response?.data?.message;
    if (msg) return msg;
    if (axiosErr.response?.status === 400) return "Geçersiz uyku kaydı.";
    return fallback;
  };

  const submitBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (includeWakeNow) {
        if (wakeDateTime <= bedDateTime) {
          onError("Kalkış zamanı yatıştan sonra olmalıdır.");
          setSubmitting(false);
          return;
        }
        await healthApi.createSleep({
          bedTime: bedDateTime.toISOString(),
          wakeTime: wakeDateTime.toISOString(),
          quality,
          note: note.trim() || undefined,
        });
        onSuccess("Uyku kaydı (yatış + kalkış) eklendi.");
      } else {
        await healthApi.createSleep({
          bedTime: bedDateTime.toISOString(),
          wakeTime: null,
          quality: null,
          note: note.trim() || undefined,
        });
        onSuccess("Yatış kaydedildi. Sabah kalkışı ekleyebilirsiniz.");
      }
      setNote("");
      setIncludeWakeNow(false);
      setWakeTimeTouched(false);
      await loadOpen();
    } catch (err) {
      onError(sleepApiError(err, "Yatış kaydedilemedi."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitWake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openSleep) {
      onError("Tamamlanacak yatış kaydı yok.");
      return;
    }
    if (wakeDateTime <= new Date(openSleep.bedTime)) {
      onError("Kalkış zamanı yatıştan sonra olmalıdır.");
      return;
    }
    setSubmitting(true);
    try {
      await healthApi.completeSleep(openSleep.id, {
        wakeTime: wakeDateTime.toISOString(),
        quality,
        note: note.trim() || undefined,
      });
      onSuccess("Kalkış kaydedildi. İyi günler!");
      setNote("");
      await loadOpen();
      setMode("bed");
    } catch {
      onError("Kalkış kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setMode("bed")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2",
            mode === "bed" ? "bg-white dark:bg-black/40 shadow-sm text-primary" : "text-slate-500"
          )}
        >
          <Moon size={16} />
          Yatış
        </button>
        <button
          type="button"
          onClick={() => setMode("wake")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 relative",
            mode === "wake" ? "bg-white dark:bg-black/40 shadow-sm text-primary" : "text-slate-500"
          )}
        >
          <Sun size={16} />
          Kalkış
          {openSleep && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {loadingOpen ? (
        <p className="text-sm text-slate-400 text-center py-4">Yükleniyor...</p>
      ) : mode === "bed" && openSleep ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Bekleyen yatış kaydı var</p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Yatış: {formatDateTime(openSleep.bedTime)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Yeni yatış kaydı eklemek için önce &quot;Kalkış&quot; sekmesinden mevcut kaydı tamamlayın veya geçmişten silin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode("wake")}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
          >
            Kalkışı Kaydet
          </button>
        </div>
      ) : mode === "bed" ? (
        <form onSubmit={submitBed} className="space-y-4">
          <TurkishDateTimeInput
            label="Yatış Zamanı"
            value={bedDateTime}
            onChange={handleBedDateTimeChange}
          />

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWakeNow}
              onChange={(e) => handleIncludeWakeNowChange(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              Kalkış zamanını şimdi de gireceğim
              <span className="block text-xs text-slate-500 mt-0.5">
                İşaretlemezseniz sadece yatış kaydedilir
              </span>
            </span>
          </label>

          {includeWakeNow && (
            <>
              <TurkishDateTimeInput
                label="Kalkış Zamanı"
                value={wakeDateTime}
                onChange={handleWakeDateTimeChange}
              />
              <label className="block text-sm font-medium">Uyku Kalitesi (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold border",
                      quality === q
                        ? "bg-primary text-white border-primary"
                        : "border-slate-200 dark:border-white/10"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </>
          )}

          <SleepNoteField value={note} onChange={setNote} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover-scale disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : includeWakeNow ? "Uyku Kaydını Tamamla" : "Yatışı Kaydet"}
          </button>
        </form>
      ) : openSleep ? (
        <form onSubmit={submitWake} className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Bekleyen yatış</p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Yatış: {formatDateTime(openSleep.bedTime)}
            </p>
            {openSleep.note && (
              <p className="text-xs text-slate-500 mt-1">Not: {openSleep.note}</p>
            )}
          </div>

          <TurkishDateTimeInput
            label="Kalkış Zamanı"
            value={wakeDateTime}
            onChange={handleWakeDateTimeChange}
          />

          <label className="block text-sm font-medium">Uyku Kalitesi (1-5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold border",
                  quality === q
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 dark:border-white/10"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          <SleepNoteField value={note} onChange={setNote} label="Kalkış notu (opsiyonel)" />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover-scale disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : "Kalkışı Kaydet"}
          </button>
        </form>
      ) : (
        <p className="text-center text-slate-500 py-8 text-sm">
          Tamamlanacak yatış kaydı yok. Önce &quot;Yatış&quot; sekmesinden yatış zamanını kaydedin.
        </p>
      )}
    </div>
  );
};

function SleepNoteField({
  value,
  onChange,
  label = "Not (opsiyonel)",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Örn. geç yattım, kahve içtim..."
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base resize-none"
      />
    </div>
  );
}
