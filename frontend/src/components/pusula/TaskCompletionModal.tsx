import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DurationMinutesInput } from "../ui/DurationMinutesInput";
import type { PusulaTask } from "../../types/pusula";

interface TaskCompletionModalProps {
  task: PusulaTask;
  onConfirm: (actualMinutes: number | null) => void | Promise<void>;
  onClose: () => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  task,
  onConfirm,
  onClose,
}) => {
  const [minutes, setMinutes] = useState(task.estimatedMinutes ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(minutes > 0 ? minutes : null);
    } catch {
      setError("Görev güncellenemedi.");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        disabled={saving}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-completion-title"
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 id="task-completion-title" className="font-semibold">
            Gerçekleşen Süre
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {task.title}
            </span>
          </p>

          <DurationMinutesInput
            value={minutes}
            onChange={setMinutes}
            label="Gerçekleşen süre (dakika)"
          />

          <p className="text-xs text-slate-400">
            {task.estimatedMinutes != null && task.estimatedMinutes > 0
              ? `Planlanan: ${task.estimatedMinutes} dk. `
              : ""}
            Süreyi boş bırakıp da tamamlayabilirsin.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-semibold disabled:opacity-60"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Tamamla"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
