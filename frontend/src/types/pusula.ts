export type PusulaWorkType = "none" | "deep" | "shallow";
export type PusulaRecurrence = "none" | "daily" | "weekly";
export type PusulaStatus = "pending" | "completed" | "notdone";

export interface PusulaCategory {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PusulaStep {
  id: number;
  title: string;
  sortOrder: number;
  isChecked: boolean;
}

export interface PusulaTask {
  id: number;
  title: string;
  note: string | null;
  categoryId: number | null;
  categoryName: string | null;
  rootCategoryName: string | null;
  date: string;
  timeOfDay: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  priority: number;
  workType: PusulaWorkType;
  recurrence: PusulaRecurrence;
  recurrenceDay: number | null;
  status: PusulaStatus;
  sortOrder: number;
  steps: PusulaStep[];
}

export interface PusulaDay {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  tasks: PusulaTask[];
}

export interface PusulaTaskInput {
  title: string;
  note?: string | null;
  categoryId?: number | null;
  date?: string;
  timeOfDay?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  priority?: number;
  workType?: PusulaWorkType;
  recurrence?: PusulaRecurrence;
  recurrenceDay?: number | null;
  steps?: string[];
}

export interface PusulaDayReview {
  date: string;
  startVision: string | null;
  endReflection: string | null;
  feelingScore: number | null;
  updatedAt: string | null;
}

export interface PusulaTrendBucket {
  key: string;
  label: string;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
}

export interface PusulaTrend {
  period: string;
  bucket: string;
  availableBuckets: string[];
  buckets: PusulaTrendBucket[];
}

export interface PusulaCategorySlice {
  name: string;
  taskCount: number;
  percent: number;
}
