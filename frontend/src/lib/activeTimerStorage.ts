const STORAGE_KEY = "hayat_active_timer";

export interface StoredActiveTimer {
  startTime: string;
  finishAt?: string | null;
}

export function readStoredActiveTimer(): StoredActiveTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveTimer;
    if (!parsed?.startTime) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredActiveTimer(timer: StoredActiveTimer | null) {
  if (!timer) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

export function elapsedMinutes(startTimeIso: string, endTime?: Date | string | null): number {
  const start = new Date(startTimeIso).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.max(0, Math.floor((end - start) / 60_000));
}

export function elapsedMinutesCeil(startTimeIso: string, endTime: string): number {
  const start = new Date(startTimeIso).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1;
  return Math.max(1, Math.ceil((end - start) / 60_000));
}

export function dateIsoFromStart(startTimeIso: string): string {
  const d = new Date(startTimeIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
