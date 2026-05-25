/** Opsiyonel mesafe (km), en fazla bir ondalık hane */
export function parseDistanceKm(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d+(\.\d)?$/.test(trimmed)) return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 9999.9) return null;
  return Math.round(n * 10) / 10;
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null) return null;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function normalizeStravaUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
