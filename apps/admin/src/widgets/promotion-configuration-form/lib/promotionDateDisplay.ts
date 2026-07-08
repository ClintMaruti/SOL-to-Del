import { formatDate } from "@/shared/lib";

export function formatPromotionDateRange(from: string, to: string) {
  if (from && to) {
    return `${formatDate(from)} - ${formatDate(to)}`;
  }

  if (from) return formatDate(from);
  if (to) return formatDate(to);

  return null;
}

export function formatPromotionRelativeRange(
  fromDays: number | null,
  toDays: number | null,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (fromDays == null && toDays == null) return null;

  if (fromDays != null && toDays != null) {
    return `${fromDays} - ${toDays} ${t("admin:labels.days")}`;
  }

  return `${fromDays ?? toDays} ${t("admin:labels.days")}`;
}
