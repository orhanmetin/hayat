import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sunrise, Sunset, Star } from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import type { PusulaDayReview, PusulaDayReviewPerformance } from "../../types/pusula";
import { DatePickerTurkish } from "../ui/DatePickerTurkish";
import { formatMinutes } from "../../lib/format";
import { cn } from "../../lib/utils";

type ReviewMode = "start" | "end";

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatCapturedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [performance, setPerformance] = useState<PusulaDayReviewPerformance | null>(null);
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

  const applyReview = (review: PusulaDayReview) => {
    setStartVision(review.startVision ?? "");
    setEndReflection(review.endReflection ?? "");
    setFeelingScore(review.feelingScore);
    setPerformance(review.performance);
  };

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const reviewRes = await pusulaApi.getDayReview(d);
      applyReview(reviewRes.data);
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
      const res = await pusulaApi.upsertDayReview({
        date,
        mode,
        startVision: mode === "start" ? startVision : undefined,
        endReflection: mode === "end" ? endReflection : undefined,
        feelingScore: mode === "end" ? feelingScore : undefined,
      });
      applyReview(res.data);
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
              {performance ? (
                <PerformanceSnapshotCard performance={performance} />
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-sm text-slate-500 leading-relaxed">
                  Henüz sabitlenmiş performans yok.{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Kaydet
                  </span>{" "}
                  dediğinde o anki gün performansı kayda alınır ve sonraki görev
                  değişikliklerinden etkilenmez.
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
              {saving
                ? "Kaydediliyor..."
                : saved
                  ? "Kaydedildi ✓"
                  : mode === "end"
                    ? performance
                      ? "Güncelle"
                      : "Kaydet ve sabitle"
                    : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

function PerformanceSnapshotCard({
  performance,
}: {
  performance: PusulaDayReviewPerformance;
}) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
          Sabitlenmiş performans
        </p>
        <p className="text-2xl font-bold">
          {performance.completedTasks}
          <span className="text-sm font-medium text-slate-400">
            /{performance.totalTasks}
          </span>
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Tamamlanan / Planlanan
          {performance.totalTasks > 0 ? ` · %${performance.completionPercent}` : ""}
        </p>
        {(performance.plannedMinutes > 0 || performance.actualMinutes > 0) && (
          <p className="text-xs text-slate-500 mt-2">
            Süre: {formatMinutes(performance.plannedMinutes)} planlanan ·{" "}
            {formatMinutes(performance.actualMinutes)} gerçekleşen
          </p>
        )}
        <p className="text-[11px] text-slate-400 mt-2">
          Kayıt: {formatCapturedAt(performance.capturedAt)}
        </p>
      </div>

      {performance.categories.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-white/5">
            <span>Ana kategori</span>
            <span className="text-right">Plan</span>
            <span className="text-right">Gerçek</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {performance.categories.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 text-sm items-center"
              >
                <span className="font-medium truncate">{row.name}</span>
                <span className="text-right text-slate-500 tabular-nums min-w-[4.5rem]">
                  {formatMinutes(row.plannedMinutes)}
                </span>
                <span className="text-right font-semibold tabular-nums min-w-[4.5rem]">
                  {formatMinutes(row.actualMinutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
