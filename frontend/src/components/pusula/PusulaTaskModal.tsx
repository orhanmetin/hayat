import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2 } from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import type {
  PusulaCategory,
  PusulaTask,
  PusulaWorkType,
} from "../../types/pusula";
import { TimePickerDropdown } from "../ui/TimePickerDropdown";
import { DatePickerTurkish } from "../ui/DatePickerTurkish";
import { cn } from "../../lib/utils";

const PRIORITY_OPTIONS = [
  { value: 1, label: "High" },
  { value: 2, label: "Mid" },
  { value: 3, label: "Low" },
] as const;

const CATEGORY_INDENT = "\u00A0\u00A0\u00A0";

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

interface PusulaTaskModalProps {
  task?: PusulaTask | null;
  /** Prefill a create form from an existing task (date forced to today). */
  copyFrom?: PusulaTask | null;
  categories: PusulaCategory[];
  defaultDate: string | null;
  onClose: () => void;
  onSaved: (task: PusulaTask) => void;
}

export const PusulaTaskModal: React.FC<PusulaTaskModalProps> = ({
  task,
  copyFrom = null,
  categories,
  defaultDate,
  onClose,
  onSaved,
}) => {
  const isEdit = !!task;
  const isCopy = !task && !!copyFrom;
  const source = task ?? copyFrom;
  const [title, setTitle] = useState(source?.title ?? "");
  const [note, setNote] = useState(source?.note ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(source?.categoryId ?? null);
  const [date, setDate] = useState<string | null>(
    isCopy ? todayIso() : task ? task.date : defaultDate
  );
  const [timeOfDay, setTimeOfDay] = useState(source?.timeOfDay ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    source?.estimatedMinutes ? String(source.estimatedMinutes) : ""
  );
  const [actualMinutes, setActualMinutes] = useState<string>(
    source?.actualMinutes ? String(source.actualMinutes) : ""
  );
  const [priority, setPriority] = useState(source?.priority ?? 3);
  const [workType, setWorkType] = useState<PusulaWorkType>(source?.workType ?? "none");
  const [newSteps, setNewSteps] = useState<string[]>(
    isCopy ? (copyFrom?.steps.map((s) => s.title) ?? []) : []
  );
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

  const rootCategories = useMemo(
    () => categories.filter((c) => c.parentId === null && c.isActive),
    [categories]
  );
  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && c.isActive);

  const quickDates = [
    { label: "Bugün", value: todayIso() },
    { label: "Yarın", value: addDaysIso(todayIso(), 1) },
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
      date: date ?? null,
      timeOfDay: date && timeOfDay ? timeOfDay : null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) || null : null,
      actualMinutes: actualMinutes ? parseInt(actualMinutes, 10) || null : null,
      priority,
      workType,
      recurrence: "none" as const,
      recurrenceDay: null,
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

  // text-base (≥16px) prevents iOS Safari auto-zoom on focus
  const inputClass =
    "w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl max-h-[min(92dvh,92vh)] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl overscroll-contain"
      >
        <div className="sticky top-0 z-10 shrink-0 bg-white dark:bg-bg-dark flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-semibold text-base">
            {isEdit ? "Görevi Düzenle" : isCopy ? "Görevi Kopyala" : "Yeni Görev"}
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

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 overflow-y-auto flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
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
                return (
                  <React.Fragment key={root.id}>
                    <option value={root.id}>{root.name}</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {CATEGORY_INDENT}
                        {c.name}
                      </option>
                    ))}
                  </React.Fragment>
                );
              })}
            </select>
          </div>

          <div>
            <label className={labelClass}>Tarih</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDate(null);
                  setTimeOfDay("");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold border transition-colors",
                  date === null
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50"
                )}
              >
                Tarihsiz
              </button>
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setDate(q.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-semibold border transition-colors",
                    date === q.value
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50"
                  )}
                >
                  {q.label}
                </button>
              ))}
              {date !== null ? (
                <DatePickerTurkish
                  value={isoToLocalDate(date)}
                  onChange={(d) => setDate(localDateToIso(d))}
                  className="min-w-[10rem] flex-1"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setDate(todayIso())}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/50"
                >
                  Tarih seç…
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {date !== null && (
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
                inputMode="numeric"
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
                inputMode="numeric"
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

          {!isEdit && (
            <div>
              <label className={labelClass}>Alt Adımlar</label>
              <div className="space-y-1.5">
                {newSteps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-base"
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
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-semibold text-base"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60 text-base"
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
