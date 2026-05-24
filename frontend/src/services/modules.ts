import { apiClient } from "./api";
import type {
  DashboardAnalytics,
  DashboardSummary,
  DeepWorkSession,
  Habit,
  LookupType,
  MeditationSession,
  SleepLog,
  SportActivity,
  WeekInfo,
  WeeklyGoal,
} from "../types/modules";

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>("/dashboard/summary"),
  getAnalytics: (period: string) =>
    apiClient.get<DashboardAnalytics>(`/dashboard/analytics?period=${period}`),
};

export const habitsApi = {
  getAll: () => apiClient.get<Habit[]>("/habits"),
  create: (name: string) => apiClient.post<Habit>("/habits", { name }),
  toggle: (id: number) => apiClient.post<Habit>(`/habits/${id}/toggle`),
  setCheckIn: (id: number, date: string, completed: boolean) =>
    apiClient.put<Habit>(`/habits/${id}/check-in`, { date, completed }),
  remove: (id: number) => apiClient.delete(`/habits/${id}`),
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
  createSleep: (data: {
    bedTime: string;
    wakeTime: string;
    quality: number;
    note?: string;
  }) => apiClient.post("/health/sleep", data),
  updateSleep: (id: number, data: {
    bedTime: string;
    wakeTime: string;
    quality: number;
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
    note?: string;
  }) => apiClient.post("/health/sport", data),
  updateSport: (id: number, data: {
    sportActivityTypeId: number;
    date: string;
    durationMinutes: number;
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
