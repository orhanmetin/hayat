import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Sparkles } from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import { pusulaAutoScore } from "../../types/pusula";
import type {
  PusulaCategory,
  PusulaRecurrence,
  PusulaTask,
  PusulaWorkType,
} from "../../types/pusula";
import { TimePickerDropdown } from "../ui/TimePickerDropdown";
import { DatePickerTurkish } from "../ui/DatePickerTurkish";
import { cn } from "../../lib/utils";

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const PRIORITY_OPTIONS = [
  { value: 1, label: "High" },
  { value: 2, label: "Mid" },
  { value: 3, label: "Low" },
] as const;

function parseTimeOfDay(value: string): { hours: number; minutes: number } {
  const [h, m] = value.split(":").map(Number);
  return {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

function formatTimeOfDay(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function addDaysIso(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

function endOfWeekIso(): string {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? 0 : 7 - dow;
  return addDaysIso(todayIso(), diff);
}

interface PusulaTaskModalProps {
  task?: PusulaTask | null;
  categories: PusulaCategory[];
  defaultDate: string;
  onClose: () => void;
  onSaved: (task: PusulaTask) => void;
}

export const PusulaTaskModal: React.FC<PusulaTaskModalProps> = ({
  task,
  categories,
  defaultDate,
  onClose,
  onSaved,
}) => {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [note, setNote] = useState(task?.note ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(task?.categoryId ?? null);
  const [date, setDate] = useState(task?.date ?? defaultDate);
  const [timeOfDay, setTimeOfDay] = useState(task?.timeOfDay ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    task?.estimatedMinutes ? String(task.estimatedMinutes) : ""
  );
  const [actualMinutes, setActualMinutes] = useState<string>(
    task?.actualMinutes ? String(task.actualMinutes) : ""
  );
  const [priority, setPriority] = useState(task?.priority ?? 3);
  const [workType, setWorkType] = useState<PusulaWorkType>(task?.workType ?? "none");
  const [recurrence, setRecurrence] = useState<PusulaRecurrence>(task?.recurrence ?? "none");
  const [recurrenceDay, setRecurrenceDay] = useState<number>(
    task?.recurrenceDay ?? new Date().getDay()
  );
  const [manualScore, setManualScore] = useState<string>(
    task?.manualScore != null ? String(task.manualScore) : ""
  );
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [stepDraft, setStepDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const autoScore = pusulaAutoScore(
    priority,
    estimatedMinutes ? parseInt(estimatedMinutes, 10) : null
  );
  const effectiveScore = manualScore !== "" ? parseInt(manualScore, 10) || 0 : autoScore;

  const rootCategories = useMemo(
    () => categories.filter((c) => c.parentId === null && c.isActive),
    [categories]
  );
  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && c.isActive);

  const quickDates = [
    { label: "Bugün", value: todayIso() },
    { label: "Yarın", value: addDaysIso(todayIso(), 1) },
    { label: "Bu Hafta", value: endOfWeekIso() },
  ];

  const addStepDraft = () => {
    const t = stepDraft.trim();
    if (!t) return;
    setNewSteps((s) => [...s, t]);
    setStepDraft("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Başlık gerekli.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      note: note.trim() || null,
      categoryId,
      date,
      timeOfDay: recurrence === "none" && timeOfDay ? timeOfDay : null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) || null : null,
      actualMinutes: actualMinutes ? parseInt(actualMinutes, 10) || null : null,
      priority,
      workType,
      recurrence,
      recurrenceDay: recurrence === "weekly" ? recurrenceDay : null,
      manualScore: manualScore !== "" ? parseInt(manualScore, 10) || null : null,
    };
    try {
      const res = isEdit
        ? await pusulaApi.updateTask(task!.id, payload)
        : await pusulaApi.createTask({ ...payload, steps: newSteps });
      onSaved(res.data);
    } catch {
      setError("Görev kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5";

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
        className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-bg-dark flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-semibold">{isEdit ? "Görevi Düzenle" : "Yeni Görev"}</h2>
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
          <div>
            <label className={labelClass}>Başlık *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ne yapılacak?"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Not</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Kategori</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            >
              <option value="">Kategorisiz</option>
              {rootCategories.map((root) => {
                const children = childrenOf(root.id);
                return children.length > 0 ? (
                  <optgroup key={root.id} label={root.name}>
                    <option value={root.id}>{root.name} (genel)</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={root.id} value={root.id}>
                    {root.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className={labelClass}>Tarih</label>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setDate(q.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
                    date === q.value
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50"
                  )}
                >
                  {q.label}
                </button>
              ))}
              <DatePickerTurkish
                value={isoToLocalDate(date)}
                onChange={(d) => setDate(localDateToIso(d))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recurrence === "none" && (
              <div>
                <label className={labelClass}>Saat</label>
                {timeOfDay ? (
                  <div className="space-y-1.5">
                    <TimePickerDropdown
                      hours={parseTimeOfDay(timeOfDay).hours}
                      minutes={parseTimeOfDay(timeOfDay).minutes}
                      minuteStep={5}
                      onChange={(h, m) => setTimeOfDay(formatTimeOfDay(h, m))}
                    />
                    <button
                      type="button"
                      onClick={() => setTimeOfDay("")}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Saati kaldır
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimeOfDay("09:00")}
                    className={cn(inputClass, "text-left text-slate-400")}
                  >
                    Saat seç (00–23)
                  </button>
                )}
              </div>
            )}
            <div>
              <label className={labelClass}>Tahmini Süre (dk)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="örn. 60"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Gerçekleşen Süre (dk)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                placeholder="—"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Öncelik</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold border transition-colors",
                    priority === opt.value
                      ? opt.value === 1
                        ? "bg-red-500 text-white border-red-500"
                        : opt.value === 2
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-sky-500 text-white border-sky-500"
                      : "border-slate-200 dark:border-white/10 text-slate-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Tekrarlama</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "none", label: "Yok" },
                  { id: "daily", label: "Günde 1" },
                  { id: "weekly", label: "Haftada 1" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                    recurrence === opt.id
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 dark:border-white/10 text-slate-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {recurrence === "weekly" && (
              <select
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                className={cn(inputClass, "mt-2")}
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            {recurrence !== "none" && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Tekrarlayan görevler saat almaz; günün listesinde bağımsız görünür.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Görev Türü</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "none", label: "Belirsiz" },
                  { id: "deep", label: "Deep Work" },
                  { id: "shallow", label: "Shallow Work" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWorkType(opt.id)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                    workType === opt.id
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-slate-200 dark:border-white/10 text-slate-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Önerilen puan: </span>
              <strong>{autoScore}</strong>
              <span className="text-xs text-slate-400 ml-2">
                (
                {PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? "Low"} ×{" "}
                {estimatedMinutes ? `${estimatedMinutes}dk/15` : "1 birim"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Manuel:</label>
              <input
                type="number"
                min={0}
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                placeholder={String(autoScore)}
                className="w-20 p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-sm text-center"
              />
            </div>
          </div>
          <p className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 -mt-2">
            Görev puanı: {effectiveScore}
          </p>

          {!isEdit && (
            <div>
              <label className={labelClass}>Alt Adımlar</label>
              <div className="space-y-1.5">
                {newSteps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-sm"
                  >
                    <span className="flex-1">{s}</span>
                    <button
                      type="button"
                      onClick={() => setNewSteps((arr) => arr.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Adımı sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={stepDraft}
                    onChange={(e) => setStepDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStepDraft();
                      }
                    }}
                    placeholder="Alt adım ekle..."
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addStepDraft}
                    className="px-4 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                    aria-label="Adım ekle"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1 pb-2">
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
              {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
