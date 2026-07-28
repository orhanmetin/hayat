export interface Anecdote {
  id: number;
  text: string;
  author: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimer {
  startTime: string;
}

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
  todayCount: number;
  currentStreak: number;
  recordStreak: number;
  createdAt: string;
}

export interface CountBucketValue {
  key: string;
  label: string;
  count: number;
}

export type HabitTrendView = "daily" | "weekly" | "monthly";

export interface HabitAnalytics {
  period: string;
  bucket: string;
  rangeStart: string;
  rangeEnd: string;
  todayCount: number;
  periodTotal: number;
  series: CountBucketValue[];
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
  meditationTypeId: number;
  typeName: string;
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

// --- Road to Barcelona 24h ---

export interface RacePrepCountGoal {
  count: number;
  target: number;
  percent: number;
}

export interface RacePrepTotalVolume {
  totalKm: number;
  targetKm: number;
  percent: number;
  avgDailyKm: number;
  projectedKm: number;
  onTrack: boolean;
}

export interface RacePrepWeeklyVolume {
  currentWeekKm: number;
  weekTargetKm: number;
  currentWeekPercent: number;
  achievedWeeks: number;
  coreWeeks: number;
  targetWeeks: number;
  achievedPercent: number;
}

export interface RacePrepBackToBack {
  achieved: boolean;
  occurrences: number;
  target: number;
}

export interface RacePrepSpeed {
  currentWeekCount: number;
  achievedWeeks: number;
  coreWeeks: number;
  targetWeeks: number;
  percent: number;
}

export interface RacePrepStrength {
  currentWeekCount: number;
  weekTarget: number;
  currentWeekPercent: number;
  achievedWeeks: number;
  totalWeeks: number;
  targetWeeks: number;
  percent: number;
}

export interface RacePrepSleep {
  avgMinutes: number;
  targetMinutes: number;
  percent: number;
  daysWithData: number;
}

export interface RacePrepOverview {
  startDate: string;
  raceDate: string;
  totalWeeks: number;
  currentWeek: number;
  weekPercent: number;
  daysToRace: number;
  started: boolean;
  totalVolume: RacePrepTotalVolume;
  weeklyVolume: RacePrepWeeklyVolume;
  longRuns: RacePrepCountGoal;
  longerRuns: RacePrepCountGoal;
  marathonRuns: RacePrepCountGoal;
  backToBack: RacePrepBackToBack;
  speed: RacePrepSpeed;
  strength: RacePrepStrength;
  sleep: RacePrepSleep;
  visualization: RacePrepCountGoal;
}

export type RacePrepGoalKey =
  | "totalVolume"
  | "weeklyVolume"
  | "longRuns"
  | "longerRuns"
  | "marathonRuns"
  | "backToBack"
  | "speed"
  | "strength"
  | "sleep"
  | "visualization";

export interface RacePrepTrendPoint {
  key: string;
  label: string;
  value: number;
}

export interface RacePrepActivityItem {
  dateLabel: string;
  title: string;
  subtitle: string | null;
  value: number | null;
  unit: string | null;
  link: string | null;
}

export interface RacePrepGoalDetail {
  goalKey: string;
  mode: "trend" | "list";
  title: string;
  unit: "km" | "minutes" | "count" | string;
  targetValue: number | null;
  trend: RacePrepTrendPoint[];
  items: RacePrepActivityItem[];
}

// --- Digital (steps + screen time via Shortcuts) ---

export interface DailyStep {
  date: string;
  steps: number;
  source: string;
  syncedAt: string;
}

export interface ScreenTimeEntry {
  date: string;
  appName: string;
  kind: "app" | "website" | string;
  minutes: number;
  syncedAt: string;
}

export interface ScreenTimeDaySummary {
  date: string;
  totalMinutes: number;
  topApps: ScreenTimeEntry[];
}

export interface DigitalOverview {
  steps: DailyStep[];
  screenTime: ScreenTimeDaySummary[];
  from: string;
  to: string;
}

export interface ShortcutsTokenStatus {
  hasToken: boolean;
  tokenPreview: string | null;
  updatedAt: string | null;
}

export interface ShortcutsTokenCreated {
  token: string;
  tokenPreview: string;
}
