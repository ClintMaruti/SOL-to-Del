/** Local time only: H+:MM, optional :SS(.fraction), optional trailing spaces (legacy 24h API). */
const BACKEND_TIME_24H = /^\s*(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*$/;

/** 12h API / form: h:mm AM/PM (case-insensitive on input; optional space before period). */
const BACKEND_TIME_12H = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

function format24hHourMinuteTo12h(hour24: number, minute: number): string {
  const m = String(minute).padStart(2, "0");
  if (hour24 === 0) return `12:${m} AM`;
  if (hour24 < 12) return `${hour24}:${m} AM`;
  if (hour24 === 12) return `12:${m} PM`;
  return `${hour24 - 12}:${m} PM`;
}

/**
 * Parses a trimmed 12-hour string and returns canonical `h:mm AM` / `h:mm PM`
 * (uppercase period, single space before AM/PM, hour 1–12 without leading zero).
 */
export function canonicalize12HourTime(value: string): string {
  const s = value.trim();
  if (!s) return "";

  const m = BACKEND_TIME_12H.exec(s);
  if (!m) return "";

  const h12 = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3].toUpperCase() as "AM" | "PM";
  if (!Number.isFinite(h12) || !Number.isFinite(min)) return "";
  if (h12 < 1 || h12 > 12 || min < 0 || min > 59) return "";

  return `${h12}:${String(min).padStart(2, "0")} ${ap}`;
}

/**
 * Maps API schedule time strings to form state: 12h strings as returned by the API,
 * or legacy `HH:mm(:ss)` local times converted to the same canonical 12h shape.
 */
export function backendScheduleTimeToForm(
  value: string | undefined | null
): string {
  if (value == null) return "";
  const s = value.trim();
  if (!s) return "";

  const from12 = canonicalize12HourTime(s);
  if (from12) return from12;

  const m24 = BACKEND_TIME_24H.exec(s);
  if (!m24) return "";

  const h = Number(m24[1]);
  const min = Number(m24[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return "";

  const hour24 = Math.min(23, Math.max(0, Math.trunc(h)));
  const minute = Math.min(59, Math.max(0, Math.trunc(min)));

  return format24hHourMinuteTo12h(hour24, minute);
}

/** Normalizes user/API 12h text for request bodies (casing, spacing). */
export function toApi12HourTime(trimmed: string): string {
  if (!trimmed) return "";
  return canonicalize12HourTime(trimmed);
}
