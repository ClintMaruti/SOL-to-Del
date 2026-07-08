import type { TFunction } from "i18next";

import { formatDate } from "@/shared/lib";

import type { ItinerariesFilterChip, ItinerariesFilterChipKey } from "./types";

export const FIRST_LINE_CONTENT_GAP_PX = 12;
export const FILTER_CHIP_GAP_PX = 4;

export function getVisibleFilterChipCount(
  chipWidths: number[],
  availableWidth: number,
  dotWidth: number
): number {
  if (chipWidths.length === 0) {
    return 0;
  }

  const totalChipWidth = chipWidths.reduce((total, width, index) => {
    return total + width + (index > 0 ? FILTER_CHIP_GAP_PX : 0);
  }, 0);

  if (totalChipWidth <= availableWidth) {
    return chipWidths.length;
  }

  let visibleWidth = 0;
  let visibleChipCount = 0;

  for (const [index, width] of chipWidths.entries()) {
    const nextVisibleWidth =
      visibleChipCount === 0
        ? width
        : visibleWidth + FILTER_CHIP_GAP_PX + width;
    const hasHiddenChipsAfterCurrent = index < chipWidths.length - 1;
    const totalWidthWithOverflowToggle = hasHiddenChipsAfterCurrent
      ? nextVisibleWidth + FILTER_CHIP_GAP_PX + dotWidth
      : nextVisibleWidth;

    if (totalWidthWithOverflowToggle > availableWidth) {
      break;
    }

    visibleWidth = nextVisibleWidth;
    visibleChipCount = index + 1;
  }

  return visibleChipCount;
}

const FILTER_ORDER: ItinerariesFilterChipKey[] = [
  "agencyId",
  "bookedById",
  "destinationId",
  "status",
  "paymentStatus",
  "dateFrom",
  "dateTo",
  "createdOnFrom",
  "createdOnTo",
];

export function buildItinerariesFilterChips(params: {
  agencyId: string | null;
  bookedById: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  destinationId: string | null;
  createdOnFrom: string | null;
  createdOnTo: string | null;
  status: string | null;
  paymentStatus: string | null;
  agencyLabel: (id: string) => string | undefined;
  bookedByLabel: (id: string) => string | undefined;
  destinationLabel: (id: string) => string | undefined;
  statusLabel: (val: string) => string;
  paymentStatusLabel: (val: string) => string;
  t: TFunction<["admin", "common"]>;
}): ItinerariesFilterChip[] {
  const chips: ItinerariesFilterChip[] = [];

  for (const key of FILTER_ORDER) {
    if (key === "agencyId" && params.agencyId) {
      const name = params.agencyLabel(params.agencyId) ?? params.agencyId;
      chips.push({
        key,
        label: params.t("itineraries.filters.agencyChip", { name }),
      });
      continue;
    }
    if (key === "bookedById" && params.bookedById) {
      const name = params.bookedByLabel(params.bookedById) ?? params.bookedById;
      chips.push({
        key,
        label: params.t("itineraries.filters.bookedByChip", { name }),
      });
      continue;
    }
    if (key === "destinationId" && params.destinationId) {
      const name =
        params.destinationLabel(params.destinationId) ?? params.destinationId;
      chips.push({
        key,
        label: params.t("itineraries.filters.destinationChip", { name }),
      });
      continue;
    }
    if (key === "dateFrom" && params.dateFrom) {
      chips.push({
        key,
        label: params.t("itineraries.filters.travelDateFromChip", {
          date: formatDate(params.dateFrom),
        }),
      });
      continue;
    }
    if (key === "dateTo" && params.dateTo) {
      chips.push({
        key,
        label: params.t("itineraries.filters.travelDateToChip", {
          date: formatDate(params.dateTo),
        }),
      });
      continue;
    }
    if (key === "createdOnFrom" && params.createdOnFrom) {
      chips.push({
        key,
        label: params.t("itineraries.filters.createdOnFromChip", {
          date: formatDate(params.createdOnFrom),
        }),
      });
      continue;
    }
    if (key === "createdOnTo" && params.createdOnTo) {
      chips.push({
        key,
        label: params.t("itineraries.filters.createdOnToChip", {
          date: formatDate(params.createdOnTo),
        }),
      });
      continue;
    }
    if (key === "status" && params.status) {
      chips.push({
        key,
        label: params.t("itineraries.filters.statusChip", {
          value: params.statusLabel(params.status),
        }),
      });
      continue;
    }
    if (key === "paymentStatus" && params.paymentStatus) {
      chips.push({
        key,
        label: params.t("itineraries.filters.paymentStatusChip", {
          value: params.paymentStatusLabel(params.paymentStatus),
        }),
      });
    }
  }

  return chips;
}
