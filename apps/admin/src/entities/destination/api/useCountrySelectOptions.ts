import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { DropdownSelectOptionGroup } from "@/shared/ui";

import {
  buildCountryDropdownGroups,
  type CountrySelectOptionsContext,
} from "../lib/buildCountryDropdownGroups";
import { useDestinations } from "./useDestinations";

/**
 * Country dropdown groups for supplier vs agency / head office (see product AC-5 / AC-6).
 */
export function useCountrySelectOptions(
  context: CountrySelectOptionsContext = "agencyOrHeadOffice"
): DropdownSelectOptionGroup[] {
  const { data: destinations } = useDestinations();
  const { t } = useTranslation("admin");

  return useMemo(
    () =>
      buildCountryDropdownGroups(destinations, context, {
        preferred: t("labels.destinationCountries"),
        otherCatalog: t("labels.otherCatalogDestinations"),
        allCountries: t("labels.allCountries"),
      }),
    [destinations, context, t]
  );
}
