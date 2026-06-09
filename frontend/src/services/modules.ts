import { apiClient } from "./api";
import type {
  DashboardAnalytics,
  DashboardBucket,
  DashboardOverview,
  DashboardPeriod,
  Anecdote,
  DashboardSummary,
  DeepWorkSession,
  Habit,
  HabitAnalytics,
  LookupType,
  MeditationSession,
  SleepLog,
  SportActivity,
  StravaConnectionStatus,
  StravaSyncResult,
  WeekInfo,
  WeeklyGoal,
} from "../types/modules";

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>("/dashboard/summary"),
  getAnalytics: (period: string) =>
    apiClient.get<DashboardAnalytics>(`/dashboard/analytics?period=${period}`),
  getOverview: (period: DashboardPeriod, bucket?: DashboardBucket) =>
    apiClient.get<DashboardOverview>("/dashboard/overview", {
      params: { period, bucket },
    }),
};

export const habitsApi = {
  getAll: () => apiClient.get<Habit[]>("/habits"),
  create: (name: string) => apiClient.post<Habit>("/habits", { name }),
  addCheckIn: (id: number) => apiClient.post<Habit>(`/habits/${id}/check-ins`),
  toggle: (id: number) => apiClient.post<Habit>(`/habits/${id}/toggle`),
  setCheckIn: (id: number, date: string, completed: boolean) =>
    apiClient.put<Habit>(`/habits/${id}/check-in`, { date, completed }),
  getAnalytics: (id: number, period: string, bucket?: string) =>
    apiClient.get<HabitAnalytics>(`/habits/${id}/analytics`, { params: { period, bucket } }),
  remove: (id: number) => apiClient.delete(`/habits/${id}`),
};

export const stravaApi = {
  getConnectUrl: () => apiClient.get<{ url: string }>("/strava/connect-url"),
  getStatus: () => apiClient.get<StravaConnectionStatus>("/strava/status"),
  disconnect: () => apiClient.delete("/strava/disconnect"),
  syncActivities: () =>
    apiClient.post<StravaSyncResult>("/sports/sync-strava", null, {
      timeout: 120_000,
    }),
};

export const anecdotesApi = {
  getAll: () => apiClient.get<Anecdote[]>("/anecdotes"),
  create: (data: { text: string; author?: string | null }) =>
    apiClient.post<Anecdote>("/anecdotes", data),
  update: (id: number, data: { text: string; author?: string | null }) =>
    apiClient.put<Anecdote>(`/anecdotes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/anecdotes/${id}`),
};

export const managementApi = {
  getSportTypes: () => apiClient.get<LookupType[]>("/management/sport-types"),
  createSportType: (name: string) =>
    apiClient.post<LookupType>("/management/sport-types", { name }),
  deleteSportType: (id: number) => apiClient.delete(`/management/sport-types/${id}`),
  getDeepWorkTypes: () => apiClient.get<LookupType[]>("/management/deep-work-types"),
  createDeepWorkType: (name: string) =>
    apiClient.post<LookupType>("/management/deep-work-types", { name }),
  deleteDeepWorkType: (id: number) =>
    apiClient.delete(`/management/deep-work-types/${id}`),
};

export const healthApi = {
  getSleep: (from?: string, to?: string) =>
    apiClient.get<SleepLog[]>("/health/sleep", {
      params: { from, to },
    }),
  getOpenSleep: async (): Promise<{ data: SleepLog | null }> => {
    try {
      const res = await apiClient.get<SleepLog>("/health/sleep/open");
      return { data: res.data };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return { data: null };
      throw err;
    }
  },
  createSleep: (data: {
    bedTime: string;
    wakeTime?: string | null;
    quality?: number | null;
    note?: string;
  }) => apiClient.post("/health/sleep", data),
  completeSleep: (
    id: number,
    data: { wakeTime: string; quality: number; note?: string }
  ) => apiClient.post(`/health/sleep/${id}/complete`, data),
  updateSleep: (id: number, data: {
    bedTime: string;
    wakeTime?: string | null;
    quality?: number | null;
    note?: string;
  }) => apiClient.put(`/health/sleep/${id}`, data),
  deleteSleep: (id: number) => apiClient.delete(`/health/sleep/${id}`),

  getSport: (from?: string, to?: string, typeId?: number) =>
    apiClient.get<SportActivity[]>("/health/sport", {
      params: { from, to, typeId },
    }),
  createSport: (data: {
    sportActivityTypeId: number;
    date: string;
    durationMinutes: number;
    distanceKm?: number | null;
    stravaLink?: string | null;
    note?: string;
  }) => apiClient.post("/health/sport", data),
  updateSport: (id: number, data: {
    sportActivityTypeId: number;
    date: string;
    durationMinutes: number;
    distanceKm?: number | null;
    stravaLink?: string | null;
    note?: string;
  }) => apiClient.put(`/health/sport/${id}`, data),
  deleteSport: (id: number) => apiClient.delete(`/health/sport/${id}`),

  getMeditation: (from?: string, to?: string) =>
    apiClient.get<MeditationSession[]>("/health/meditation", {
      params: { from, to },
    }),
  createMeditation: (data: { date: string; durationMinutes: number }) =>
    apiClient.post("/health/meditation", data),
  updateMeditation: (id: number, data: { date: string; durationMinutes: number }) =>
    apiClient.put(`/health/meditation/${id}`, data),
  deleteMeditation: (id: number) => apiClient.delete(`/health/meditation/${id}`),
};

export const deepWorkApi = {
  getAll: (from?: string, to?: string, typeId?: number) =>
    apiClient.get<DeepWorkSession[]>("/deepwork", {
      params: { from, to, typeId },
    }),
  create: (data: {
    deepWorkTypeId: number;
    date: string;
    durationMinutes: number;
    description?: string;
  }) => apiClient.post("/deepwork", data),
  update: (id: number, data: {
    deepWorkTypeId: number;
    date: string;
    durationMinutes: number;
    description?: string;
  }) => apiClient.put(`/deepwork/${id}`, data),
  delete: (id: number) => apiClient.delete(`/deepwork/${id}`),
};

export const weeklyGoalsApi = {
  getCurrentWeek: () => apiClient.get<WeekInfo>("/weeklygoals/current-week"),
  get: (year: number, weekNumber: number) =>
    apiClient.get<WeeklyGoal>(`/weeklygoals?year=${year}&weekNumber=${weekNumber}`),
  upsert: (data: Record<string, unknown>) => apiClient.put<WeeklyGoal>("/weeklygoals", data),
};
