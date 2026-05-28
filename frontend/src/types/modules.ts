export interface LookupType {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StravaConnectionStatus {
  isConnected: boolean;
  athleteId: number | null;
  expiresAtUtc: string | null;
  lastSyncAtUtc: string | null;
}

export interface StravaImportedActivity {
  stravaActivityId: number;
  title: string;
  activityTypeName: string;
}

export interface StravaSyncResult {
  importedCount: number;
  skippedCount: number;
  imported: StravaImportedActivity[];
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

export type DashboardPeriod = "weekly" | "monthly" | "yearly";
export type DashboardBucket = "daily" | "weekly" | "monthly";

export interface CategoryBreakdownItem {
  name: string;
  minutes: number;
}

export interface SportCard {
  totalMinutes: number;
  targetMinutes: number | null;
  breakdown: CategoryBreakdownItem[];
}

export interface SleepCard {
  totalMinutes: number;
  averageMinutesPerDay: number;
  targetAverageMinutesPerDay: number | null;
}

export interface DeepWorkCard {
  totalMinutes: number;
  averageMinutesPerDay: number;
  targetAverageMinutesPerDay: number | null;
  breakdown: CategoryBreakdownItem[];
}

export interface MeditationCard {
  totalMinutes: number;
  averageMinutesPerDay: number;
  targetAverageMinutesPerDay: number | null;
}

export interface DashboardCards {
  sport: SportCard;
  sleep: SleepCard;
  deepWork: DeepWorkCard;
  meditation: MeditationCard;
}

export interface TimeBucketValue {
  key: string;
  label: string;
  minutes: number;
}

export interface StackedBucket {
  key: string;
  label: string;
  total: number;
  segments: Record<string, number>;
}

export interface StackedSeries {
  categories: string[];
  buckets: StackedBucket[];
}

export interface DashboardSeries {
  sleep: TimeBucketValue[];
  meditation: TimeBucketValue[];
  sport: StackedSeries;
  deepWork: StackedSeries;
}

export interface DashboardOverview {
  period: DashboardPeriod;
  bucket: DashboardBucket;
  availableBuckets: DashboardBucket[];
  rangeStart: string;
  rangeEnd: string;
  daysElapsed: number;
  showTargets: boolean;
  cards: DashboardCards;
  series: DashboardSeries;
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
  wakeTime: string | null;
  durationMinutes: number;
  quality: number;
  note?: string;
  listDate: string;
  isComplete: boolean;
}

export interface SportActivity {
  id: number;
  sportActivityTypeId: number;
  activityTypeName: string;
  date: string;
  durationMinutes: number;
  distanceKm?: number | null;
  stravaLink?: string | null;
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
