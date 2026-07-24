import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  BarChart3,
  CalendarDays,
  List,
  Sunrise,
} from "lucide-react";
import { pusulaApi } from "../services/pusula";
import type { PusulaCategory, PusulaDay, PusulaTask } from "../types/pusula";
import { PusulaTaskCard } from "../components/pusula/PusulaTaskCard";
import { PusulaTaskModal } from "../components/pusula/PusulaTaskModal";
import { PusulaCalendar } from "../components/pusula/PusulaCalendar";
import { DayReviewModal } from "../components/pusula/DayReviewModal";
import { SegmentedControl } from "../components/dashboard/SegmentedControl";

type SortKey = "time" | "priority" | "category";
type ViewKey = "list" | "day" | "week";

function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function addDaysIso(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

function weekStartIso(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  const dow = d.getDay();
  return addDaysIso(dateIso, dow === 0 ? -6 : 1 - dow);
}

function formatDateTr(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const PusulaPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [weekDays, setWeekDays] = useState<PusulaDay[]>([]);
  const [categories, setCategories] = useState<PusulaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [view, setView] = useState<ViewKey>("list");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: PusulaTask | null }>({
    open: false,
    task: null,
  });
  const [reviewOpen, setReviewOpen] = useState(false);

  const weekStart = weekStartIso(selectedDate);

  const load = useCallback(async () => {
    try {
      const [daysRes, catsRes] = await Promise.all([
        pusulaApi.getDays(weekStart, addDaysIso(weekStart, 6)),
        pusulaApi.getCategories(),
      ]);
      setWeekDays(daysRes.data);
      setCategories(catsRes.data);
      setError(null);
    } catch {
      setError("Görevler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const day = useMemo(
    () => weekDays.find((d) => d.date === selectedDate) ?? null,
    [weekDays, selectedDate]
  );

  const sortedTasks = useMemo(() => {
    if (!day) return [];
    const tasks = [...day.tasks];
    switch (sortKey) {
      case "priority":
        return tasks.sort((a, b) => a.priority - b.priority || b.score - a.score);
      case "category":
        return tasks.sort((a, b) =>
          (a.categoryName ?? "zzz").localeCompare(b.categoryName ?? "zzz", "tr") ||
          a.priority - b.priority
        );
      default:
        return tasks.sort((a, b) => {
          if (a.timeOfDay && b.timeOfDay) return a.timeOfDay.localeCompare(b.timeOfDay);
          if (a.timeOfDay) return -1;
          if (b.timeOfDay) return 1;
          return a.priority - b.priority;
        });
    }
  }, [day, sortKey]);

  const groupedByCategory = useMemo(() => {
    if (sortKey !== "category") return null;
    const groups = new Map<string, PusulaTask[]>();
    for (const t of sortedTasks) {
      const key = t.categoryName ?? "Kategorisiz";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return groups;
  }, [sortedTasks, sortKey]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickAdding) return;
    setQuickAdding(true);
    try {
      await pusulaApi.createTask({ title, date: selectedDate });
      setQuickTitle("");
      await load();
    } catch {
      setError("Görev eklenemedi.");
    } finally {
      setQuickAdding(false);
    }
  };

  const handleTaskChanged = useCallback((updated: PusulaTask) => {
    setWeekDays((days) => recomputeDays(days, updated));
  }, []);

  const handleTaskDeleted = useCallback(() => {
    void load();
  }, [load]);

  const handleReschedule = async (taskId: number, date: string, timeOfDay: string) => {
    await pusulaApi.schedule(taskId, { date, timeOfDay });
    await load();
  };

  const isToday = selectedDate === todayIso();

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Pusula</h1>
            <p className="text-xs text-slate-400">Planlama ve görev takibi</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50"
          >
            <Sunrise size={16} />
            <span className="hidden sm:inline">Değerlendirme</span>
          </button>
          <Link
            to="/pusula/reports"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50"
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Rapor</span>
          </Link>
          <button
            type="button"
            onClick={() => setTaskModal({ open: true, task: null })}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover-scale"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Yeni Görev</span>
          </button>
        </div>
      </div>

      {/* Date nav + score */}
      <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(addDaysIso(selectedDate, -1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Önceki gün"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-semibold">{formatDateTr(selectedDate)}</p>
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso())}
                className="text-xs text-primary font-semibold"
              >
                Bugüne dön
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(addDaysIso(selectedDate, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Sonraki gün"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {day && (
          <div>
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span className="font-semibold">
                Puan Başarı Oranı: <span className="text-primary">%{day.scorePercent}</span>
              </span>
              <span className="text-xs text-slate-400">
                {day.earnedPoints}/{day.plannedPoints} puan · {day.completedTasks}/{day.totalTasks}{" "}
                görev
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700"
                style={{ width: `${Math.min(100, day.scorePercent)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Hızlı görev ekle... (sadece başlık yeterli)"
          className="flex-1 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm"
        />
        <button
          type="submit"
          disabled={quickAdding || !quickTitle.trim()}
          className="px-5 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40"
          aria-label="Görev ekle"
        >
          <Plus size={20} />
        </button>
      </form>

      {/* View + sort */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          size="sm"
          ariaLabel="Görünüm"
          options={[
            { id: "list", label: "Liste" },
            { id: "day", label: "Gün" },
            { id: "week", label: "Hafta" },
          ]}
          value={view}
          onChange={(v) => setView(v)}
        />
        {view === "list" && (
          <SegmentedControl
            size="sm"
            ariaLabel="Sıralama"
            options={[
              { id: "time", label: "Saat" },
              { id: "priority", label: "Öncelik" },
              { id: "category", label: "Kategori" },
            ]}
            value={sortKey}
            onChange={(v) => setSortKey(v)}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-center py-16 text-slate-400 text-sm">Yükleniyor…</p>
      ) : view === "list" ? (
        sortedTasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <List size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Bu gün için görev yok. Yukarıdan hızlıca ekleyin.</p>
          </div>
        ) : groupedByCategory ? (
          <div className="space-y-5">
            {[...groupedByCategory.entries()].map(([cat, tasks]) => (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                  {cat}
                </h3>
                {tasks.map((t) => (
                  <PusulaTaskCard
                    key={t.id}
                    task={t}
                    date={selectedDate}
                    onChanged={handleTaskChanged}
                    onDeleted={handleTaskDeleted}
                    onEdit={(task) => setTaskModal({ open: true, task })}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((t) => (
              <PusulaTaskCard
                key={t.id}
                task={t}
                date={selectedDate}
                onChanged={handleTaskChanged}
                onDeleted={handleTaskDeleted}
                onEdit={(task) => setTaskModal({ open: true, task })}
              />
            ))}
          </div>
        )
      ) : (
        <PusulaCalendar
          days={
            view === "day"
              ? weekDays.filter((d) => d.date === selectedDate)
              : weekDays
          }
          mode={view === "day" ? "day" : "week"}
          onReschedule={handleReschedule}
          onEdit={(task) => setTaskModal({ open: true, task })}
        />
      )}

      <div className="flex items-center gap-2 text-slate-400">
        <CalendarDays size={14} />
        <p className="text-[11px]">
          Gün bittiğinde tamamlanmayan görevler raporlarda "Yapılmadı" sayılır.
        </p>
      </div>

      {taskModal.open && (
        <PusulaTaskModal
          task={taskModal.task}
          categories={categories}
          defaultDate={selectedDate}
          onClose={() => setTaskModal({ open: false, task: null })}
          onSaved={() => {
            setTaskModal({ open: false, task: null });
            void load();
          }}
        />
      )}

      {reviewOpen && (
        <DayReviewModal initialDate={selectedDate} onClose={() => setReviewOpen(false)} />
      )}
    </div>
  );
};

/** Replace the task inside week days and recompute the affected day's summary. */
function recomputeDays(days: PusulaDay[], updated: PusulaTask): PusulaDay[] {
  return days.map((d) => {
    if (d.date !== updated.date) return d;
    const tasks = d.tasks.map((t) => (t.id === updated.id ? updated : t));
    const planned = tasks.reduce((sum, t) => sum + t.score, 0);
    const earned = Math.round(tasks.reduce((sum, t) => sum + t.earnedPoints, 0) * 10) / 10;
    return {
      ...d,
      tasks,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      plannedPoints: planned,
      earnedPoints: earned,
      scorePercent: planned > 0 ? Math.round((earned * 1000) / planned) / 10 : 0,
    };
  });
}
