import type { DashboardPeriod, DashboardBucket } from "../types/modules";

export const DASHBOARD_PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "weekly", label: "Haftalık" },
  { id: "monthly", label: "Aylık" },
  { id: "yearly", label: "Yıllık" },
];

export const BUCKET_LABELS: Record<DashboardBucket, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

/** Stacked bar serileri için sabit renk paleti (categories sırasına göre kullanılır) */
export const CATEGORY_COLORS = [
  "#5f7a61",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#f97316",
  "#14b8a6",
];

export type DashboardCardKey =
  | "sport"
  | "sleep"
  | "deepwork"
  | "meditation"
  | "steps"
  | "screen";

export type CardValueUnit = "duration" | "steps";

export interface CardMeta {
  id: DashboardCardKey;
  label: string;
  /** Card primary metric: total sum or daily average */
  metric: "total" | "averagePerDay";
  /** Stacked vs simple chart (screen uses both in trend panel) */
  chart: "stacked" | "simple" | "screen";
  valueUnit: CardValueUnit;
  primaryColor: string;
  iconBg: string;
}

export const CARD_META: Record<DashboardCardKey, CardMeta> = {
  sport: {
    id: "sport",
    label: "Spor",
    metric: "total",
    chart: "stacked",
    valueUnit: "duration",
    primaryColor: "#f59e0b",
    iconBg: "text-amber-500 bg-amber-500/10",
  },
  sleep: {
    id: "sleep",
    label: "Uyku",
    metric: "averagePerDay",
    chart: "simple",
    valueUnit: "duration",
    primaryColor: "#6366f1",
    iconBg: "text-indigo-500 bg-indigo-500/10",
  },
  deepwork: {
    id: "deepwork",
    label: "Deep Work",
    metric: "averagePerDay",
    chart: "stacked",
    valueUnit: "duration",
    primaryColor: "#8b5cf6",
    iconBg: "text-violet-500 bg-violet-500/10",
  },
  meditation: {
    id: "meditation",
    label: "Meditasyon",
    metric: "averagePerDay",
    chart: "simple",
    valueUnit: "duration",
    primaryColor: "#10b981",
    iconBg: "text-emerald-500 bg-emerald-500/10",
  },
  steps: {
    id: "steps",
    label: "Adım",
    metric: "averagePerDay",
    chart: "simple",
    valueUnit: "steps",
    primaryColor: "#0ea5e9",
    iconBg: "text-sky-500 bg-sky-500/10",
  },
  screen: {
    id: "screen",
    label: "Ekran",
    metric: "averagePerDay",
    chart: "screen",
    valueUnit: "duration",
    primaryColor: "#f97316",
    iconBg: "text-orange-500 bg-orange-500/10",
  },
};
