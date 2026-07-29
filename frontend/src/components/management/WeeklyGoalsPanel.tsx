import React, { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { weeklyGoalsApi } from "../../services/modules";
import { DurationHoursMinutesInput } from "../ui/DurationHoursMinutesInput";
import { ProgressBar } from "../ui/ProgressBar";
import { GOAL_TARGET_DEFINITIONS } from "../../config/weeklyGoals";
import { formatDate } from "../../lib/format";
import { joinToTotalMinutes, splitTotalMinutes } from "../../lib/duration";
import type { WeeklyGoal } from "../../types/modules";

type GoalFormState = Record<
  string,
  { hours: number; minutes: number; steps: number }
>;

function goalStateFromWeeklyGoal(goal: WeeklyGoal | null): GoalFormState {
  const state: GoalFormState = {};
  for (const def of GOAL_TARGET_DEFINITIONS) {
    const target = (goal?.[def.targetKey] as number | undefined) ?? 0;
    if (def.input === "steps") {
      state[def.id] = { hours: 0, minutes: 0, steps: target };
    } else {
      const parts = splitTotalMinutes(target);
      state[def.id] = { ...parts, steps: 0 };
    }
  }
  return state;
}

export const WeeklyGoalsPanel: React.FC = () => {
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormState>(() =>
    goalStateFromWeeklyGoal(null)
  );
  const [weekInfo, setWeekInfo] = useState({
    year: 0,
    weekNumber: 0,
    weekStart: "",
    weekEnd: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const week = await weeklyGoalsApi.getCurrentWeek();
    setWeekInfo({
      year: week.data.year,
      weekNumber: week.data.weekNumber,
      weekStart: week.data.weekStart,
      weekEnd: week.data.weekEnd,
    });
    try {
      const goal = await weeklyGoalsApi.get(week.data.year, week.data.weekNumber);
      setWeeklyGoal(goal.data);
      setGoalForm(goalStateFromWeeklyGoal(goal.data));
    } catch {
      setWeeklyGoal(null);
      setGoalForm(goalStateFromWeeklyGoal(null));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateGoalPart = (
    id: string,
    part: "hours" | "minutes" | "steps",
    value: number
  ) => {
    setGoalForm((prev) => ({
      ...prev,
      [id]: { ...prev[id], [part]: value },
    }));
    setSaved(false);
  };

  const saveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        year: weekInfo.year,
        weekNumber: weekInfo.weekNumber,
      };
      for (const def of GOAL_TARGET_DEFINITIONS) {
        const part = goalForm[def.id] ?? { hours: 0, minutes: 0, steps: 0 };
        payload[def.targetKey] =
          def.input === "steps"
            ? Math.max(0, Math.round(part.steps))
            : joinToTotalMinutes(part.hours, part.minutes);
      }
      await weeklyGoalsApi.upsert(payload);
      await load();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target size={20} className="text-primary" />
          Haftalık Hedefler
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Hafta {weekInfo.weekNumber} / {weekInfo.year}
          {weekInfo.weekStart && (
            <> · {formatDate(weekInfo.weekStart)} – {formatDate(weekInfo.weekEnd)}</>
          )}
        </p>
      </div>

      <form onSubmit={saveGoals} className="space-y-4">
        {GOAL_TARGET_DEFINITIONS.map((def) => {
          const part = goalForm[def.id] ?? { hours: 0, minutes: 0, steps: 0 };
          if (def.input === "steps") {
            return (
              <div
                key={def.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{def.label}</p>
                    <p className="text-xs text-slate-500">{def.description}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    {def.periodLabel}
                  </span>
                </div>
                <label className="block text-xs text-slate-500">
                  Hedef (adım / gün)
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={part.steps || ""}
                    onChange={(e) =>
                      updateGoalPart(def.id, "steps", Number(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                    placeholder="örn. 8000"
                  />
                </label>
              </div>
            );
          }
          return (
            <DurationHoursMinutesInput
              key={def.id}
              label={def.label}
              period={def.period}
              periodLabel={def.periodLabel}
              description={def.description}
              hours={part.hours}
              minutes={part.minutes}
              onHoursChange={(h) => updateGoalPart(def.id, "hours", h)}
              onMinutesChange={(m) => updateGoalPart(def.id, "minutes", m)}
            />
          );
        })}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Hedefleri Kaydet"}
        </button>
        {saved && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
            Hedefler kaydedildi.
          </p>
        )}
      </form>

      {weeklyGoal && (
        <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-white/5">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Bu hafta ilerleme
          </p>
          {GOAL_TARGET_DEFINITIONS.map((def) => (
            <ProgressBar
              key={def.id}
              label={def.label}
              periodLabel={def.periodLabel}
              current={weeklyGoal.progress[def.currentProgressKey] as number}
              target={weeklyGoal[def.targetKey] as number | undefined}
              formatDuration={def.input === "duration"}
              unit={def.input === "steps" ? " adım" : ""}
              colorClass={def.colorClass}
            />
          ))}
        </div>
      )}
    </div>
  );
};
