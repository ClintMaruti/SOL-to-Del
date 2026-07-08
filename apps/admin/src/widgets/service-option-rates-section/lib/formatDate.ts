import { formatDate } from "@/shared/lib";

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Formats an ISO date string as "01 Jan 2025". Returns "Select" if falsy. */
export function formatShortDate(iso: string | undefined): string {
  if (!iso) return "Select";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "Select";
  const day = String(d).padStart(2, "0");
  const month = SHORT_MONTH_NAMES[m - 1];
  return `${day} ${month} ${y}`;
}

export const formatDateRange = (from: string, to: string) => {
  if (!from && !to) return null;
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  return formatDate(to);
};
