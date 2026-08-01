import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  Zap,
  Waves,
} from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import type { PusulaTask } from "../../types/pusula";
import { cn } from "../../lib/utils";
import { TaskCompletionModal } from "./TaskCompletionModal";

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-red-500/10 text-red-600 dark:text-red-400",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  3: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Mid",
  3: "Low",
};

interface PusulaTaskCardProps {
  task: PusulaTask;
  date: string | null;
  onChanged: (task: PusulaTask) => void;
  onDeleted: (taskId: number) => void;
  onEdit: (task: PusulaTask) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (taskId: number) => void;
  onDragOver?: (taskId: number) => void;
  onDrop?: (taskId: number) => void;
  onDragEnd?: () => void;
}

export const PusulaTaskCard: React.FC<PusulaTaskCardProps> = ({
  task,
  date,
  onChanged,
  onDeleted,
  onEdit,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [stepDraft, setStepDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  const completed = task.status === "completed";
  const notDone = task.status === "notdone";

  const markPending = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await pusulaApi.setStatus(task.id, {
        date,
        status: "pending",
      });
      onChanged(res.data);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusClick = () => {
    if (busy) return;
    if (completed) {
      void markPending();
      return;
    }
    setCompletionOpen(true);
  };

  const handleConfirmCompletion = async (actualMinutes: number | null) => {
    setBusy(true);
    try {
      const res = await pusulaApi.setStatus(task.id, {
        date,
        status: "completed",
        ...(actualMinutes != null ? { actualMinutes } : {}),
      });
      onChanged(res.data);
      setCompletionOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const toggleStep = async (stepId: number) => {
    const res = await pusulaApi.toggleStep(stepId, date);
    onChanged(res.data);
  };

  const addStep = async () => {
    const title = stepDraft.trim();
    if (!title) return;
    const res = await pusulaApi.addStep(task.id, title, date);
    setStepDraft("");
    onChanged(res.data);
  };

  const deleteStep = async (stepId: number) => {
    const res = await pusulaApi.deleteStep(stepId, date);
    onChanged(res.data);
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${task.title}" görevini kalıcı olarak silmek istediğinize emin misiniz?`))
      return;
    await pusulaApi.deleteTask(task.id);
    onDeleted(task.id);
  };

  const checkedSteps = task.steps.filter((s) => s.isChecked).length;

  return (
    <>
    <div
      onDragOver={
        draggable
          ? (e) => {
              e.preventDefault();
              onDragOver?.(task.id);
            }
          : undefined
      }
      onDrop={
        draggable
          ? (e) => {
              e.preventDefault();
              onDrop?.(task.id);
            }
          : undefined
      }
      className={cn(
        "rounded-2xl border p-3.5 transition-colors",
        completed
          ? "bg-emerald-500/5 border-emerald-500/20"
          : notDone
            ? "bg-red-500/5 border-red-500/15"
            : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary/40 border-primary/40"
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/pusula-list-task", String(task.id));
              onDragStart?.(task.id);
            }}
            onDragEnd={onDragEnd}
            className="mt-0.5 p-1 rounded-lg text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            aria-label="Sürükle"
            title="Sürükleyerek sırala"
          >
            <GripVertical size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={handleStatusClick}
          disabled={busy}
          className={cn(
            "w-6 h-6 mt-0.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
            completed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-300 dark:border-white/20 hover:border-primary"
          )}
          aria-label={completed ? "Beklemede yap" : "Tamamlandı yap"}
        >
          {completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={cn(
                "font-medium text-sm leading-snug text-left hover:text-primary transition-colors",
                completed && "line-through text-slate-400"
              )}
            >
              {task.title}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
            <span className={cn("px-1.5 py-0.5 rounded-md font-bold", PRIORITY_STYLES[task.priority])}>
              {PRIORITY_LABELS[task.priority] ?? "Low"}
            </span>
            {task.categoryName && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                {task.categoryName}
              </span>
            )}
            {task.timeOfDay && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock size={11} />
                {task.timeOfDay}
                {task.estimatedMinutes ? ` · ${task.estimatedMinutes}dk` : ""}
              </span>
            )}
            {!task.timeOfDay && task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock size={11} />
                {task.estimatedMinutes}dk
              </span>
            )}
            {task.recurrence !== "none" && (
              <span className="flex items-center gap-1 text-violet-500">
                <Repeat size={11} />
                {task.recurrence === "daily" ? "Her gün" : "Haftalık"}
              </span>
            )}
            {task.workType === "deep" && (
              <span className="flex items-center gap-1 text-indigo-500">
                <Zap size={11} />
                Deep
              </span>
            )}
            {task.workType === "shallow" && (
              <span className="flex items-center gap-1 text-cyan-600">
                <Waves size={11} />
                Shallow
              </span>
            )}
            {notDone && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 font-semibold">
                Yapılmadı
              </span>
            )}
            {task.steps.length > 0 && (
              <span className="text-slate-400">
                {checkedSteps}/{task.steps.length} adım
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
          aria-label={expanded ? "Daralt" : "Genişlet"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pl-9 space-y-3">
          {task.note && (
            <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
              {task.note}
            </p>
          )}

          <div className="space-y-1.5">
            {task.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                    step.isChecked
                      ? "bg-primary border-primary text-white"
                      : "border-slate-300 dark:border-white/20"
                  )}
                  aria-label="Adımı işaretle"
                >
                  {step.isChecked && <Check size={11} strokeWidth={3} />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-xs",
                    step.isChecked && "line-through text-slate-400"
                  )}
                >
                  {step.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteStep(step.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                  aria-label="Adımı sil"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <input
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addStep();
                  }
                }}
                placeholder="Alt adım ekle..."
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-xs"
              />
              <button
                type="button"
                onClick={addStep}
                className="px-2.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500"
                aria-label="Adım ekle"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {task.actualMinutes != null && (
              <span className="text-slate-400">Gerçekleşen: {task.actualMinutes}dk</span>
            )}
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-medium"
              >
                <Pencil size={13} />
                Düzenle
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 font-medium"
              >
                <Trash2 size={13} />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {completionOpen && (
      <TaskCompletionModal
        task={task}
        onConfirm={handleConfirmCompletion}
        onClose={() => setCompletionOpen(false)}
      />
    )}
    </>
  );
};
