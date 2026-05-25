import type { WeeklyGoal } from "../types/modules";

export type GoalPeriod = "daily" | "weekly";

export interface GoalTargetDefinition {
  id: string;
  label: string;
  period: GoalPeriod;
  periodLabel: string;
  description: string;
  targetKey: keyof Pick<
    WeeklyGoal,
    | "targetAvgSleepMinutesPerDay"
    | "targetTotalSportMinutes"
    | "targetAvgDeepWorkMinutesPerDay"
    | "targetAvgMeditationMinutesPerDay"
  >;
  currentProgressKey: keyof WeeklyGoal["progress"];
  progressPercentKey: keyof WeeklyGoal["progress"];
  colorClass: string;
}

export const GOAL_TARGET_DEFINITIONS: GoalTargetDefinition[] = [
  {
    id: "sleep",
    label: "Uyku",
    period: "daily",
    periodLabel: "Günlük",
    description: "Günlük toplam uyku hedefi",
    targetKey: "targetAvgSleepMinutesPerDay",
    currentProgressKey: "currentAvgSleepMinutes",
    progressPercentKey: "sleepProgress",
    colorClass: "bg-indigo-500",
  },
  {
    id: "sport",
    label: "Spor",
    period: "weekly",
    periodLabel: "Haftalık",
    description: "Haftalık toplam aktivite süresi",
    targetKey: "targetTotalSportMinutes",
    currentProgressKey: "currentTotalSportMinutes",
    progressPercentKey: "sportProgress",
    colorClass: "bg-amber-500",
  },
  {
    id: "meditation",
    label: "Meditasyon",
    period: "daily",
    periodLabel: "Günlük",
    description: "Günlük toplam meditasyon hedefi",
    targetKey: "targetAvgMeditationMinutesPerDay",
    currentProgressKey: "currentAvgMeditationMinutes",
    progressPercentKey: "meditationProgress",
    colorClass: "bg-emerald-500",
  },
  {
    id: "deepwork",
    label: "Deep Work",
    period: "daily",
    periodLabel: "Günlük",
    description: "Günlük toplam deep work hedefi",
    targetKey: "targetAvgDeepWorkMinutesPerDay",
    currentProgressKey: "currentAvgDeepWorkMinutes",
    progressPercentKey: "deepWorkProgress",
    colorClass: "bg-violet-500",
  },
];
