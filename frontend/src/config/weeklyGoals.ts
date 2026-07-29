import type { WeeklyGoal } from "../types/modules";

export type GoalPeriod = "daily" | "weekly";
export type GoalInputKind = "duration" | "steps";

export interface GoalTargetDefinition {
  id: string;
  label: string;
  period: GoalPeriod;
  periodLabel: string;
  description: string;
  input: GoalInputKind;
  targetKey: keyof Pick<
    WeeklyGoal,
    | "targetAvgSleepMinutesPerDay"
    | "targetTotalSportMinutes"
    | "targetAvgDeepWorkMinutesPerDay"
    | "targetAvgMeditationMinutesPerDay"
    | "targetAvgStepsPerDay"
    | "targetAvgScreenMinutesPerDay"
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
    input: "duration",
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
    input: "duration",
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
    input: "duration",
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
    input: "duration",
    targetKey: "targetAvgDeepWorkMinutesPerDay",
    currentProgressKey: "currentAvgDeepWorkMinutes",
    progressPercentKey: "deepWorkProgress",
    colorClass: "bg-violet-500",
  },
  {
    id: "steps",
    label: "Adım",
    period: "daily",
    periodLabel: "Günlük",
    description: "Günlük toplam adım sayısı hedefi",
    input: "steps",
    targetKey: "targetAvgStepsPerDay",
    currentProgressKey: "currentAvgSteps",
    progressPercentKey: "stepsProgress",
    colorClass: "bg-sky-500",
  },
  {
    id: "screen",
    label: "Ekran süresi",
    period: "daily",
    periodLabel: "Günlük",
    description: "Günlük toplam ekran süresi hedefi",
    input: "duration",
    targetKey: "targetAvgScreenMinutesPerDay",
    currentProgressKey: "currentAvgScreenMinutes",
    progressPercentKey: "screenProgress",
    colorClass: "bg-orange-500",
  },
];
