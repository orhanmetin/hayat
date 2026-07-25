import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sunrise, Sunset, Star } from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import type { PusulaDay } from "../../types/pusula";
import { DatePickerTurkish } from "../ui/DatePickerTurkish";
import { cn } from "../../lib/utils";

type ReviewMode = "start" | "end";

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface DayReviewModalProps {
  initialDate: string;
  onClose: () => void;
}

export const DayReviewModal: React.FC<DayReviewModalProps> = ({ initialDate, onClose }) => {
  const [date, setDate] = useState(initialDate);
  const [mode, setMode] = useState<ReviewMode>("start");
  const [startVision, setStartVision] = useState("");
  const [endReflection, setEndReflection] = useState("");
  const [feelingScore, setFeelingScore] = useState<number | null>(null);
  const [dayStats, setDayStats] = useState<PusulaDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const [reviewRes, daysRes] = await Promise.all([
        pusulaApi.getDayReview(d),
        pusulaApi.getDays(d),
      ]);
      setStartVision(reviewRes.data.startVision ?? "");
      setEndReflection(reviewRes.data.endReflection ?? "");
      setFeelingScore(reviewRes.data.feelingScore);
      setDayStats(daysRes.data[0] ?? null);
    } catch {
      setError("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await pusulaApi.upsertDayReview({
        date,
        mode,
        startVision: mode === "start" ? startVision : undefined,
        endReflection: mode === "end" ? endReflection : undefined,
        feelingScore: mode === "end" ? feelingScore : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const textareaClass =
    "w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm min-h-[140px]";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-bg-dark flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-semibold">Gün Değerlendirmesi</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tarih</label>
            <DatePickerTurkish
              value={isoToLocalDate(date)}
              onChange={(d) => setDate(localDateToIso(d))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
            {(
              [
                { id: "start" as const, label: "Güne Başlangıç", icon: Sunrise },
                { id: "end" as const, label: "Gün Sonu", icon: Sunset },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={cn(
                  "py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                  mode === opt.id
                    ? "bg-white dark:bg-black/40 shadow-sm text-primary"
                    : "text-slate-500"
                )}
              >
                <opt.icon size={16} />
                {opt.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center py-8 text-sm text-slate-400">Yükleniyor…</p>
          ) : mode === "start" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Bugünden beklentilerim, vizyonum ve hedeflerim
              </label>
              <textarea
                value={startVision}
                onChange={(e) => setStartVision(e.target.value)}
                placeholder="Bugün nasıl bir gün olacak? Neler başarmak istiyorum?"
                className={textareaClass}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {dayStats && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
                  <p className="text-2xl font-bold">
                    {dayStats.completedTasks}
                    <span className="text-sm font-medium text-slate-400">
                      /{dayStats.totalTasks}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tamamlanan / Planlanan
                    {dayStats.totalTasks > 0 ? ` · %${dayStats.completionPercent}` : ""}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Gün Nasıldı?
                </label>
                <div className="flex gap-1.5 justify-center py-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFeelingScore(feelingScore === n ? null : n)}
                      className="p-1"
                      aria-label={`${n} yıldız`}
                    >
                      <Star
                        size={30}
                        className={cn(
                          "transition-colors",
                          feelingScore != null && n <= feelingScore
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Günün Değerlendirmesi
                </label>
                <textarea
                  value={endReflection}
                  onChange={(e) => setEndReflection(e.target.value)}
                  placeholder="Neler iyi gitti? Neler geliştirilebilir?"
                  className={textareaClass}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-semibold"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={cn(
                "flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-60 transition-colors",
                saved ? "bg-emerald-500" : "bg-primary"
              )}
            >
              {saving ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
