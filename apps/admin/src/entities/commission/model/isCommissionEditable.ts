export function toLocalIsoDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isCommissionDateInPast(
  effectiveFrom: string,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return effectiveFrom < todayIsoDate;
}

export function isCommissionDateTodayOrPast(
  effectiveFrom: string,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return effectiveFrom <= todayIsoDate;
}

/**
 * Commissions can only be edited or deleted when they start after today.
 * Date-only ISO strings can be compared lexicographically safely.
 */
export function isCommissionEditable(
  effectiveFrom: string,
  todayIsoDate: string = toLocalIsoDateString()
): boolean {
  return effectiveFrom > todayIsoDate;
}
