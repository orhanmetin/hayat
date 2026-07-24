import { apiClient } from "./api";
import type {
  PusulaCategory,
  PusulaCategorySlice,
  PusulaDay,
  PusulaDayReview,
  PusulaTask,
  PusulaTaskInput,
  PusulaTrend,
} from "../types/pusula";

export const pusulaApi = {
  // Categories
  getCategories: () => apiClient.get<PusulaCategory[]>("/pusula/categories"),
  createCategory: (data: { name: string; parentId?: number | null }) =>
    apiClient.post<PusulaCategory>("/pusula/categories", data),
  updateCategory: (id: number, data: { name: string }) =>
    apiClient.put<PusulaCategory>(`/pusula/categories/${id}`, data),
  deleteCategory: (id: number) => apiClient.delete(`/pusula/categories/${id}`),

  // Days & tasks
  getDays: (from: string, to?: string) =>
    apiClient.get<PusulaDay[]>("/pusula/days", { params: { from, to: to ?? from } }),
  createTask: (data: PusulaTaskInput) => apiClient.post<PusulaTask>("/pusula/tasks", data),
  updateTask: (id: number, data: PusulaTaskInput) =>
    apiClient.put<PusulaTask>(`/pusula/tasks/${id}`, data),
  deleteTask: (id: number) => apiClient.delete(`/pusula/tasks/${id}`),
  setStatus: (
    id: number,
    data: { date: string; status?: "completed" | "pending" | null; actualMinutes?: number | null }
  ) => apiClient.post<PusulaTask>(`/pusula/tasks/${id}/status`, data),
  schedule: (id: number, data: { date?: string | null; timeOfDay?: string | null }) =>
    apiClient.put<PusulaTask>(`/pusula/tasks/${id}/schedule`, data),
  reorder: (data: { date: string; taskIds: number[] }) =>
    apiClient.post("/pusula/tasks/reorder", data),

  // Steps
  addStep: (taskId: number, title: string, date: string) =>
    apiClient.post<PusulaTask>(`/pusula/tasks/${taskId}/steps`, { title }, { params: { date } }),
  deleteStep: (stepId: number, date: string) =>
    apiClient.delete<PusulaTask>(`/pusula/steps/${stepId}`, { params: { date } }),
  toggleStep: (stepId: number, date: string) =>
    apiClient.post<PusulaTask>(`/pusula/steps/${stepId}/toggle`, { date }),

  // Day review
  getDayReview: (date: string) =>
    apiClient.get<PusulaDayReview>("/pusula/day-review", { params: { date } }),
  upsertDayReview: (data: {
    date: string;
    mode: "start" | "end";
    startVision?: string | null;
    endReflection?: string | null;
    feelingScore?: number | null;
  }) => apiClient.put<PusulaDayReview>("/pusula/day-review", data),

  // Reports
  getTrend: (period: string, bucket?: string) =>
    apiClient.get<PusulaTrend>("/pusula/reports/trend", { params: { period, bucket } }),
  getCategoryDistribution: (from: string, to: string) =>
    apiClient.get<PusulaCategorySlice[]>("/pusula/reports/categories", { params: { from, to } }),
};
