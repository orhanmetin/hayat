import React from "react";
import { Play, Square, Timer } from "lucide-react";
import { useActiveTimer } from "../../hooks/useActiveTimer";
import { ActiveTimerSaveModal } from "./ActiveTimerSaveModal";
import { formatMinutes } from "../../lib/format";
import type { LookupType } from "../../types/modules";
import { cn } from "../../lib/utils";

interface ActiveTimerPanelProps {
  deepWorkTypes: LookupType[];
  meditationTypes: LookupType[];
  onSaved?: () => void;
}

export const ActiveTimerPanel: React.FC<ActiveTimerPanelProps> = ({
  deepWorkTypes,
  meditationTypes,
  onSaved,
}) => {
  const timer = useActiveTimer();

  const handleSaved = async () => {
    await timer.clear();
    onSaved?.();
  };

  if (timer.loading) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-slate-400 text-center">
        Zamanlayıcı yükleniyor...
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "p-5 rounded-2xl border transition-all",
          timer.isRunning
            ? "bg-primary/10 border-primary/30 dark:bg-primary-light/10"
            : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                timer.isRunning ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/5 text-primary"
              )}
            >
              <Timer size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Aktif Zamanlayıcı</p>
              {timer.startTime ? (
                <p className="text-sm text-slate-500 mt-0.5">
                  {timer.isFinished
                    ? `Durduruldu · ${formatMinutes(timer.displayMinutes)}`
                    : `${formatMinutes(timer.displayMinutes)} süredir aktif`}
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-0.5">
                  Deep Work veya meditasyon için süreyi takip edin
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!timer.startTime && (
              <button
                type="button"
                onClick={timer.start}
                disabled={timer.actionLoading}
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm flex items-center gap-2 hover-scale disabled:opacity-60"
              >
                <Play size={16} fill="currentColor" />
                Başlat
              </button>
            )}
            {timer.isRunning && (
              <button
                type="button"
                onClick={timer.finish}
                className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-white/10 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Square size={14} fill="currentColor" />
                Bitir
              </button>
            )}
          </div>
        </div>
      </div>

      {timer.isFinished && timer.startTime && timer.finishAt && (
        <ActiveTimerSaveModal
          startTime={timer.startTime}
          finishAt={timer.finishAt}
          deepWorkTypes={deepWorkTypes}
          meditationTypes={meditationTypes}
          onClose={timer.resume}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};
