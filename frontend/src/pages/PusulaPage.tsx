import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  BarChart3,
  Sunrise,
} from "lucide-react";
import { pusulaApi } from "../services/pusula";
import type {
  PusulaCategory,
  PusulaDay,
  PusulaTask,
  PusulaWorkType,
} from "../types/pusula";
import { PusulaTaskCard } from "../components/pusula/PusulaTaskCard";
import { PusulaTaskModal } from "../components/pusula/PusulaTaskModal";
import { PusulaCalendar } from "../components/pusula/PusulaCalendar";
import { DayReviewModal } from "../components/pusula/DayReviewModal";
import { SegmentedControl } from "../components/dashboard/SegmentedControl";
import { formatMinutes } from "../lib/format";

type SortKey = "manual" | "time" | "priority" | "category" | "workType";
type ViewKey = "list" | "day" | "week";
type ScopeKey = "dated" | "undated";

const WORK_TYPE_ORDER: Record<PusulaWorkType, number> = {
  deep: 0,
  shallow: 1,
  none: 2,
};

const WORK_TYPE_LABELS: Record<PusulaWorkType, string> = {
  deep: "Deep Work",
  shallow: "Shallow Work",
  none: "Belirsiz",
};

function completedLast(a: PusulaTask, b: PusulaTask): number {
  const aDone = a.status === "completed" ? 1 : 0;
  const bDone = b.status === "completed" ? 1 : 0;
  return aDone - bDone;
}

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

function sortTasks(tasks: PusulaTask[], sortKey: SortKey): PusulaTask[] {
  const list = [...tasks];
  const byStatusThen = (cmp: (a: PusulaTask, b: PusulaTask) => number) =>
    list.sort((a, b) => completedLast(a, b) || cmp(a, b));

  switch (sortKey) {
    case "priority":
      return byStatusThen((a, b) => a.priority - b.priority || a.sortOrder - b.sortOrder);
    case "category":
      return byStatusThen(
        (a, b) =>
          (a.categoryName ?? "zzz").localeCompare(b.categoryName ?? "zzz", "tr") ||
          a.priority - b.priority
      );
    case "workType":
      return byStatusThen(
        (a, b) =>
          WORK_TYPE_ORDER[a.workType] - WORK_TYPE_ORDER[b.workType] ||
          a.priority - b.priority ||
          a.sortOrder - b.sortOrder
      );
    case "time":
      return byStatusThen((a, b) => {
        if (a.timeOfDay && b.timeOfDay) return a.timeOfDay.localeCompare(b.timeOfDay);
        if (a.timeOfDay) return -1;
        if (b.timeOfDay) return 1;
        return a.priority - b.priority;
      });
    default:
      return byStatusThen((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }
}

export const PusulaPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [weekDays, setWeekDays] = useState<PusulaDay[]>([]);
  const [undatedTasks, setUndatedTasks] = useState<PusulaTask[]>([]);
  const [categories, setCategories] = useState<PusulaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("manual");
  const [view, setView] = useState<ViewKey>("list");
  const [scope, setScope] = useState<ScopeKey>("dated");
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: PusulaTask | null }>({
    open: false,
    task: null,
  });
  const [reviewOpen, setReviewOpen] = useState(false);

  const weekStart = weekStartIso(selectedDate);
  const showingUndated = scope === "undated";

  const load = useCallback(async () => {
    try {
      const [daysRes, undatedRes, catsRes] = await Promise.all([
        pusulaApi.getDays(weekStart, addDaysIso(weekStart, 6)),
        pusulaApi.getUndatedTasks(),
        pusulaApi.getCategories(),
      ]);
      setWeekDays(daysRes.data);
      setUndatedTasks(undatedRes.data);
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
    const source = showingUndated ? undatedTasks : day?.tasks ?? [];
    return sortTasks(source, sortKey);
  }, [showingUndated, undatedTasks, day, sortKey]);

  const canDragReorder = view === "list" && sortKey === "manual";

  const applyLocalOrder = useCallback(
    (orderedIds: number[]) => {
      if (showingUndated) {
        setUndatedTasks((tasks) => {
          const byId = new Map(tasks.map((t) => [t.id, t]));
          const reordered = orderedIds
            .map((id, index) => {
              const t = byId.get(id);
              return t ? { ...t, sortOrder: index + 1 } : null;
            })
            .filter((t): t is PusulaTask => t != null);
          const remaining = tasks.filter((t) => !orderedIds.includes(t.id));
          return [...reordered, ...remaining];
        });
        return;
      }

      setWeekDays((days) =>
        days.map((d) => {
          if (d.date !== selectedDate) return d;
          const byId = new Map(d.tasks.map((t) => [t.id, t]));
          const reordered = orderedIds
            .map((id, index) => {
              const t = byId.get(id);
              return t ? { ...t, sortOrder: index + 1 } : null;
            })
            .filter((t): t is PusulaTask => t != null);
          const remaining = d.tasks.filter((t) => !orderedIds.includes(t.id));
          return { ...d, tasks: [...reordered, ...remaining] };
        })
      );
    },
    [selectedDate, showingUndated]
  );

  const handleReorderDrop = useCallback(
    async (targetId: number) => {
      if (dragTaskId == null || dragTaskId === targetId) {
        setDragTaskId(null);
        setDropTargetId(null);
        return;
      }
      const ids = sortedTasks.map((t) => t.id);
      const from = ids.indexOf(dragTaskId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) {
        setDragTaskId(null);
        setDropTargetId(null);
        return;
      }
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, dragTaskId);
      setDragTaskId(null);
      setDropTargetId(null);
      applyLocalOrder(next);
      try {
        await pusulaApi.reorder({ date: selectedDate, taskIds: next });
      } catch {
        setError("Sıralama kaydedilemedi.");
        await load();
      }
    },
    [dragTaskId, sortedTasks, applyLocalOrder, selectedDate, load]
  );

  const groupedTasks = useMemo(() => {
    if (sortKey !== "category" && sortKey !== "workType") return null;
    const groups = new Map<string, PusulaTask[]>();
    for (const t of sortedTasks) {
      const key =
        sortKey === "category"
          ? (t.categoryName ?? "Kategorisiz")
          : WORK_TYPE_LABELS[t.workType];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return groups;
  }, [sortedTasks, sortKey]);

  const dayDurations = useMemo(() => {
    if (!day) return { planned: 0, actual: 0 };
    return day.tasks.reduce(
      (acc, t) => ({
        planned: acc.planned + (t.estimatedMinutes ?? 0),
        actual: acc.actual + (t.actualMinutes ?? 0),
      }),
      { planned: 0, actual: 0 }
    );
  }, [day]);

  const handleTaskChanged = useCallback(
    (updated: PusulaTask) => {
      if (updated.date == null) {
        setUndatedTasks((tasks) => {
          const exists = tasks.some((t) => t.id === updated.id);
          if (!exists) return [...tasks, updated];
          return tasks.map((t) => (t.id === updated.id ? updated : t));
        });
        setWeekDays((days) =>
          days.map((d) => {
            if (!d.tasks.some((t) => t.id === updated.id)) return d;
            const tasks = d.tasks.filter((t) => t.id !== updated.id);
            return recomputeDaySummary(d, tasks);
          })
        );
        return;
      }

      setUndatedTasks((tasks) => tasks.filter((t) => t.id !== updated.id));
      setWeekDays((days) => {
        let found = false;
        const next = days.map((d) => {
          if (d.date === updated.date) {
            found = true;
            const exists = d.tasks.some((t) => t.id === updated.id);
            const tasks = exists
              ? d.tasks.map((t) => (t.id === updated.id ? updated : t))
              : [...d.tasks, updated];
            return recomputeDaySummary(d, tasks);
          }
          if (d.tasks.some((t) => t.id === updated.id)) {
            return recomputeDaySummary(
              d,
              d.tasks.filter((t) => t.id !== updated.id)
            );
          }
          return d;
        });
        return found ? next : days;
      });
    },
    []
  );

  const handleTaskDeleted = useCallback((taskId: number) => {
    setUndatedTasks((tasks) => tasks.filter((t) => t.id !== taskId));
    setWeekDays((days) =>
      days.map((d) => {
        if (!d.tasks.some((t) => t.id === taskId)) return d;
        return recomputeDaySummary(
          d,
          d.tasks.filter((t) => t.id !== taskId)
        );
      })
    );
  }, []);

  const handleReschedule = async (taskId: number, date: string, timeOfDay: string) => {
    await pusulaApi.schedule(taskId, { date, timeOfDay });
    await load();
  };

  const isToday = selectedDate === todayIso();
  const cardDate = showingUndated ? null : selectedDate;

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

      <SegmentedControl
        size="sm"
        ariaLabel="Görev kapsamı"
        options={[
          { id: "dated", label: "Planlanan" },
          {
            id: "undated",
            label:
              undatedTasks.length > 0
                ? `Tarihsiz (${undatedTasks.filter((t) => t.status !== "completed").length})`
                : "Tarihsiz",
          },
        ]}
        value={scope}
        onChange={(v) => {
          setScope(v);
          if (v === "undated") setView("list");
        }}
      />

      {/* Date nav + completion */}
      {!showingUndated && (
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

          {day && day.totalTasks > 0 && (
            <div>
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="font-semibold">
                  Tamamlama: <span className="text-primary">%{day.completionPercent}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {day.completedTasks}/{day.totalTasks} görev
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, day.completionPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>
                  Planlanan:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatMinutes(dayDurations.planned)}
                  </span>
                </span>
                <span>
                  Gerçekleşen:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatMinutes(dayDurations.actual)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {showingUndated && (
        <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4">
          <p className="font-semibold">Tarihsiz görevler</p>
          <p className="text-sm text-slate-500 mt-1">
            Tarih vermeden kaydettiğin backlog. Düzenleyerek bir güne planlayabilirsin.
          </p>
        </div>
      )}

      {/* View + sort */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!showingUndated ? (
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
        ) : (
          <span className="text-xs font-semibold text-slate-400 px-1">Liste</span>
        )}
        {(view === "list" || showingUndated) && (
          <SegmentedControl
            size="sm"
            ariaLabel="Sıralama"
            options={[
              { id: "manual", label: "Sıra" },
              { id: "time", label: "Saat" },
              { id: "priority", label: "Öncelik" },
              { id: "category", label: "Kategori" },
              { id: "workType", label: "Tür" },
            ]}
            value={sortKey}
            onChange={(v) => setSortKey(v)}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-center py-16 text-slate-400 text-sm">Yükleniyor…</p>
      ) : showingUndated || view === "list" ? (
        sortedTasks.length === 0 ? (
          <p className="text-center py-12 text-sm text-slate-400">
            {showingUndated ? "Tarihsiz görev yok." : null}
          </p>
        ) : groupedTasks ? (
          <div className="space-y-5">
            {[...groupedTasks.entries()].map(([group, tasks]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                  {group}
                </h3>
                {tasks.map((t) => (
                  <PusulaTaskCard
                    key={t.id}
                    task={t}
                    date={cardDate}
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
                date={cardDate}
                onChanged={handleTaskChanged}
                onDeleted={handleTaskDeleted}
                onEdit={(task) => setTaskModal({ open: true, task })}
                draggable={canDragReorder}
                isDragging={dragTaskId === t.id}
                isDropTarget={dropTargetId === t.id && dragTaskId !== t.id}
                onDragStart={(id) => setDragTaskId(id)}
                onDragOver={(id) => setDropTargetId(id)}
                onDrop={(id) => void handleReorderDrop(id)}
                onDragEnd={() => {
                  setDragTaskId(null);
                  setDropTargetId(null);
                }}
              />
            ))}
            {canDragReorder && sortedTasks.length > 1 && (
              <p className="text-[11px] text-slate-400 px-1">
                Sol tutamacı sürükleyerek sıralayın. Tamamlanan görevler listenin sonunda kalır.
              </p>
            )}
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

      {taskModal.open && (
        <PusulaTaskModal
          task={taskModal.task}
          categories={categories}
          defaultDate={showingUndated ? null : selectedDate}
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

function recomputeDaySummary(day: PusulaDay, tasks: PusulaTask[]): PusulaDay {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  return {
    ...day,
    tasks,
    totalTasks: total,
    completedTasks: completed,
    completionPercent: total > 0 ? Math.round((completed * 1000) / total) / 10 : 0,
  };
}
