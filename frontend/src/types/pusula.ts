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
  autoScore: number;
  manualScore: number | null;
  score: number;
  status: PusulaStatus;
  earnedPoints: number;
  sortOrder: number;
  steps: PusulaStep[];
}

export interface PusulaDay {
  date: string;
  totalTasks: number;
  completedTasks: number;
  plannedPoints: number;
  earnedPoints: number;
  scorePercent: number;
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
  manualScore?: number | null;
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
  plannedPoints: number;
  earnedPoints: number;
  scorePercent: number;
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
  points: number;
  percent: number;
}

/** Auto score suggestion mirrored from backend: priority coeff (P1=3,P2=2,P3=1) x 15-min units (min 1). */
export function pusulaAutoScore(priority: number, estimatedMinutes?: number | null): number {
  const coeff = priority === 1 ? 3 : priority === 2 ? 2 : 1;
  const units =
    estimatedMinutes && estimatedMinutes > 0
      ? Math.max(1, Math.round(estimatedMinutes / 15))
      : 1;
  return coeff * units;
}
