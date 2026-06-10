const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const chartDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
});

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Gün.Ay.Yıl — örn. 24.05.2026 */
export function formatDate(value: string | Date): string {
  const d = parseDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

/**
 * API / SQLite timestamps are UTC instants. Values without "Z" must not be parsed as local wall-clock.
 */
export function parseApiDateTime(value: string): Date {
  const trimmed = value.trim();
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  return new Date(`${trimmed}Z`);
}

/** Gün.Ay.Yıl Saat:Dakika */
export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? parseApiDateTime(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFormatter.format(d);
}

export const SLEEP_TIME_MINUTE_STEP = 5;

/** Dakikayı verilen adıma yuvarlar (örn. 14:07 → 14:05, 14:08 → 14:10). */
export function roundDateToMinuteStep(date: Date, step: number = SLEEP_TIME_MINUTE_STEP): Date {
  if (step <= 1) return new Date(date);
  const ms = step * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/** Grafik ekseni için kısa tarih — örn. 24.05 */
export function formatChartDate(value: string): string {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    return value.slice(0, 5);
  }
  const d = parseDate(value);
  if (!d || Number.isNaN(d.getTime())) return value;
  return chartDateFormatter.format(d);
}

function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split(".").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Tarih girişi: 20.05.2026 */
export function dateToTurkishInput(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Saat girişi: 23:00 (24 saat) */
export function timeToTurkishInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** GG.AA.YYYY + SS:DD → Date */
export function parseTurkishDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) {
    return null;
  }

  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

/** GG.AA.YYYY → Date (öğlen) */
export function parseTurkishDate(dateStr: string): Date | null {
  return parseTurkishDateTime(dateStr, "12:00");
}

/** ISO yyyy-MM-dd veya Date → GG.AA.YYYY */
export function isoOrDateToTurkishInput(value: string | Date): string {
  const d = typeof value === "string" ? parseDate(value) : value;
  if (!d || Number.isNaN(d.getTime())) return "";
  return dateToTurkishInput(d);
}

/** GG.AA.YYYY → yyyy-MM-dd (form state için) */
export function turkishDateToIso(dateStr: string): string | null {
  const d = parseTurkishDate(dateStr);
  if (!d) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 dk";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours}s`;
  return `${hours}s ${minutes}dk`;
}

/** API için yyyy-MM-dd */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Bugün — GG.AA.YYYY */
export function todayTurkish(): string {
  return dateToTurkishInput(new Date());
}

export function toLocalDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function isoDateOnlyToInput(iso: string): string {
  if (iso.includes(".")) return iso;
  const d = parseDate(iso.slice(0, 10));
  return d ? dateToTurkishInput(d) : iso;
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Son N gün — GG.AA.YYYY (gösterim) */
export function daysAgoTurkish(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateToTurkishInput(d);
}
