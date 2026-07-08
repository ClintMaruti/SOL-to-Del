import { canonicalize12HourTime } from "./scheduleApiTime";

/** Strict 12-hour time: `h:mm AM` / `h:mm PM` after canonicalization (trimmed input). */
export function isValid12HourTime(value: string): boolean {
  return canonicalize12HourTime(value) !== "";
}
