import type { TFunction } from "i18next";

import type {
  ServiceRatesFilterChip,
  ServiceRatesFilterState,
} from "@/features/filter-service-rates";
import type { ServiceRate } from "@/entities/service-rate";
import type { ServiceOption } from "@/entities/supplier-service-options";
import { formatDate } from "@/shared/lib";

export function buildServiceRatesFilterChips(params: {
  filterState: ServiceRatesFilterState;
  options: ServiceOption[];
  rates: ServiceRate[];
  t: TFunction<"admin">;
}): ServiceRatesFilterChip[] {
  const { filterState, options, rates, t } = params;
  const chips: ServiceRatesFilterChip[] = [];

  if (filterState.optionIds.length > 0) {
    const names = filterState.optionIds
      .map((id) => options.find((o) => o.id === id)?.title ?? id)
      .join(", ");
    chips.push({
      key: "options",
      label: t("serviceRates.filters.optionsChip", { names }),
    });
  }

  if (filterState.chargeTypes.length > 0) {
    const labels = filterState.chargeTypes
      .map((ct) =>
        ct === "Person"
          ? t("extraDetail.chargeType.person")
          : t("extraDetail.chargeType.unit")
      )
      .join(", ");
    chips.push({
      key: "chargeTypes",
      label: t("serviceRates.filters.chargeTypeChip", { types: labels }),
    });
  }

  if (filterState.rateIds.length > 0) {
    const names = filterState.rateIds
      .map((id) => rates.find((r) => r.id === id)?.name ?? id)
      .join(", ");
    chips.push({
      key: "rates",
      label: t("serviceRates.filters.rateChip", { names }),
    });
  }

  if (filterState.travelDateFrom) {
    chips.push({
      key: "travelDateFrom",
      label: t("serviceRates.filters.dateFromChip", {
        date: formatDate(filterState.travelDateFrom),
      }),
    });
  }

  if (filterState.travelDateTo) {
    chips.push({
      key: "travelDateTo",
      label: t("serviceRates.filters.dateToChip", {
        date: formatDate(filterState.travelDateTo),
      }),
    });
  }

  return chips;
}
