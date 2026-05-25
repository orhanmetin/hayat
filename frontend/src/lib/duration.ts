/** Toplam dakikayı saat + dakikaya ayırır */
export function splitTotalMinutes(total: number | null | undefined): {
  hours: number;
  minutes: number;
} {
  if (total == null || total <= 0) return { hours: 0, minutes: 0 };
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/** Saat ve dakikayı toplam dakikaya çevirir; boşsa undefined */
export function joinToTotalMinutes(
  hours: number | string,
  minutes: number | string
): number | undefined {
  const h = Math.max(0, parseInt(String(hours), 10) || 0);
  const m = Math.min(59, Math.max(0, parseInt(String(minutes), 10) || 0));
  const total = h * 60 + m;
  return total > 0 ? total : undefined;
}

/** Örn. 7 sa 30 dk */
export function formatDurationHoursMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 dk";
  const { hours, minutes } = splitTotalMinutes(totalMinutes);
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}
