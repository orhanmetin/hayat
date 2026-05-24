import { apiClient } from "./api";
import type {
  DashboardAnalytics,
  DashboardSummary,
  Habit,
  LookupType,
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
  createSleep: (data: {
    bedTime: string;
    wakeTime: string;
    quality: number;
    note?: string;
  }) => apiClient.post("/health/sleep", data),
  createSport: (data: {
    sportActivityTypeId: number;
    date: string;
    durationMinutes: number;
    note?: string;
  }) => apiClient.post("/health/sport", data),
  createMeditation: (data: { date: string; durationMinutes: number }) =>
    apiClient.post("/health/meditation", data),
};

export const deepWorkApi = {
  create: (data: {
    deepWorkTypeId: number;
    date: string;
    durationMinutes: number;
    description?: string;
  }) => apiClient.post("/deepwork", data),
};

export const weeklyGoalsApi = {
  getCurrentWeek: () => apiClient.get<WeekInfo>("/weeklygoals/current-week"),
  get: (year: number, weekNumber: number) =>
    apiClient.get<WeeklyGoal>(`/weeklygoals?year=${year}&weekNumber=${weekNumber}`),
  upsert: (data: Record<string, unknown>) => apiClient.put<WeeklyGoal>("/weeklygoals", data),
};
