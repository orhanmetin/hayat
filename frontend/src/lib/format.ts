export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 dk";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours}s`;
  return `${hours}s ${minutes}dk`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
