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
