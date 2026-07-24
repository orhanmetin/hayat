import React, { useMemo, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import type { PusulaDay, PusulaTask } from "../../types/pusula";
import { cn } from "../../lib/utils";

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_PX = 56;
const SNAP_MINUTES = 15;

function minutesFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeFromMinutes(total: number): string {
  const clamped = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60 + 45, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

interface PusulaCalendarProps {
  days: PusulaDay[];
  mode: "day" | "week";
  onReschedule: (taskId: number, date: string, timeOfDay: string) => Promise<void>;
  onEdit: (task: PusulaTask) => void;
}

/** One-time tasks with a time appear as blocks; unscheduled one-time tasks can be dragged in. */
export const PusulaCalendar: React.FC<PusulaCalendarProps> = ({
  days,
  mode,
  onReschedule,
  onEdit,
}) => {
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    []
  );

  const unscheduled = useMemo(
    () =>
      days.flatMap((d) =>
        d.tasks.filter(
          (t) => t.recurrence === "none" && !t.timeOfDay && t.status !== "completed"
        )
      ),
    [days]
  );

  const handleDrop = async (e: React.DragEvent, date: string) => {
    e.preventDefault();
    const idText = e.dataTransfer.getData("text/pusula-task");
    const taskId = idText ? Number(idText) : dragTaskId;
    if (!taskId) return;

    const col = columnRefs.current[date];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = START_HOUR * 60 + (offsetY / HOUR_PX) * 60;
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    setDragTaskId(null);
    await onReschedule(taskId, date, timeFromMinutes(snapped));
  };

  const renderBlock = (task: PusulaTask) => {
    if (!task.timeOfDay) return null;
    const top = ((minutesFromTime(task.timeOfDay) - START_HOUR * 60) / 60) * HOUR_PX;
    const height = Math.max(((task.estimatedMinutes ?? 30) / 60) * HOUR_PX, 24);
    const completed = task.status === "completed";
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/pusula-task", String(task.id));
          e.dataTransfer.effectAllowed = "move";
          setDragTaskId(task.id);
        }}
        onDragEnd={() => setDragTaskId(null)}
        onDoubleClick={() => onEdit(task)}
        title={`${task.title} — ${task.timeOfDay}${task.estimatedMinutes ? ` (${task.estimatedMinutes}dk)` : ""}`}
        className={cn(
          "absolute left-0.5 right-0.5 rounded-lg px-2 py-1 text-[11px] font-medium border cursor-grab active:cursor-grabbing overflow-hidden select-none",
          completed
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            : task.priority === 1
              ? "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300"
              : task.priority === 2
                ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
                : "bg-primary/15 border-primary/30 text-primary dark:text-primary-light",
          dragTaskId === task.id && "opacity-50"
        )}
        style={{ top: `${top}px`, height: `${height}px` }}
      >
        <div className="flex items-center gap-1">
          <GripVertical size={10} className="shrink-0 opacity-50" />
          <span className="truncate">{task.title}</span>
        </div>
        {height >= 40 && (
          <p className="opacity-70 mt-0.5">
            {task.timeOfDay}
            {task.estimatedMinutes ? ` · ${task.estimatedMinutes}dk` : ""} · {task.score}p
          </p>
        )}
      </div>
    );
  };

  const visibleDays = mode === "day" ? days.slice(0, 1) : days;

  return (
    <div className="space-y-3">
      {unscheduled.length > 0 && (
        <div className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Saati olmayan görevler — takvime sürükleyin
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((t) => (
              <span
                key={`${t.id}-${t.date}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/pusula-task", String(t.id));
                  setDragTaskId(t.id);
                }}
                onDragEnd={() => setDragTaskId(null)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-medium cursor-grab active:cursor-grabbing select-none"
              >
                {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 overflow-x-auto">
        <div className="flex min-w-[560px]">
          {/* Hour gutter */}
          <div className="w-12 shrink-0 border-r border-slate-100 dark:border-white/5">
            <div className="h-9" />
            {hours.map((h) => (
              <div
                key={h}
                className="text-[10px] text-slate-400 text-right pr-1.5 border-t border-slate-100 dark:border-white/5"
                style={{ height: `${HOUR_PX}px` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {visibleDays.map((day) => (
            <div
              key={day.date}
              className="flex-1 min-w-[120px] border-r border-slate-100 dark:border-white/5 last:border-r-0"
            >
              <div className="h-9 flex items-center justify-center text-xs font-semibold border-b border-slate-100 dark:border-white/5 sticky top-0">
                {dayLabel(day.date)}
              </div>
              <div
                ref={(el) => {
                  columnRefs.current[day.date] = el;
                }}
                className="relative"
                style={{ height: `${hours.length * HOUR_PX}px` }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => void handleDrop(e, day.date)}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-slate-100 dark:border-white/5"
                    style={{ top: `${(h - START_HOUR) * HOUR_PX}px` }}
                  />
                ))}
                {day.tasks
                  .filter((t) => t.recurrence === "none" && t.timeOfDay)
                  .map((t) => renderBlock(t))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Blokları sürükleyerek saat değiştirin; düzenlemek için çift tıklayın. Tekrarlayan görevler
        takvime düşmez.
      </p>
    </div>
  );
};
