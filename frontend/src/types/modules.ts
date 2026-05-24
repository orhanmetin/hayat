export interface LookupType {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Habit {
  id: number;
  name: string;
  completedToday: boolean;
  currentStreak: number;
  recordStreak: number;
  createdAt: string;
}

export interface DashboardSummary {
  habitStreakBest: number;
  habitsCompletedToday: number;
  totalHabits: number;
  lastNightSleepMinutes: number;
  todaySportMinutes: number;
  todayDeepWorkMinutes: number;
  todayMeditationMinutes: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardChart {
  title: string;
  points: ChartDataPoint[];
}

export interface DashboardAnalytics {
  period: string;
  charts: DashboardChart[];
}

export interface WeeklyGoal {
  id: number;
  year: number;
  weekNumber: number;
  targetAvgSleepMinutesPerDay?: number;
  targetTotalSportMinutes?: number;
  targetAvgDeepWorkMinutesPerDay?: number;
  targetAvgMeditationMinutesPerDay?: number;
  progress: {
    sleepProgress: number;
    sportProgress: number;
    deepWorkProgress: number;
    meditationProgress: number;
    currentAvgSleepMinutes: number;
    currentTotalSportMinutes: number;
    currentAvgDeepWorkMinutes: number;
    currentAvgMeditationMinutes: number;
  };
}

export interface WeekInfo {
  year: number;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
}

export interface SleepLog {
  id: number;
  bedTime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: number;
  note?: string;
  wakeDate: string;
}

export interface SportActivity {
  id: number;
  sportActivityTypeId: number;
  activityTypeName: string;
  date: string;
  durationMinutes: number;
  note?: string;
}

export interface MeditationSession {
  id: number;
  date: string;
  durationMinutes: number;
}

export interface DeepWorkSession {
  id: number;
  deepWorkTypeId: number;
  typeName: string;
  date: string;
  durationMinutes: number;
  description?: string;
}

export type RecordKind = "sleep" | "sport" | "meditation" | "deepwork";
