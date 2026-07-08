import { describe, expect, it } from "vitest";

import type { Destination } from "../../model/types";
import { buildCountryDropdownGroups } from "../buildCountryDropdownGroups";

const labels = {
  preferred: "Destination countries",
  otherCatalog: "Other catalog destinations",
  allCountries: "All countries",
};

function countryDestination(
  id: string,
  name: string,
  options?: Partial<Destination>
): Destination {
  return {
    id,
    name,
    type: "Country",
    status: "Active",
    isPreferred: false,
    ...options,
  };
}

describe("buildCountryDropdownGroups", () => {
  it("maps agency/head office catalog countries to ISO official values", () => {
    const groups = buildCountryDropdownGroups(
      [countryDestination("tz", "Tanzania", { isPreferred: true })],
      "agencyOrHeadOffice",
      labels
    );

    expect(groups[0]?.options[0]).toEqual({
      value: "United Republic of Tanzania",
      label: "Tanzania",
    });
  });

  it("keeps supplier catalog countries as destination ids", () => {
    const groups = buildCountryDropdownGroups(
      [countryDestination("tz", "Tanzania", { isPreferred: true })],
      "supplier",
      labels
    );

    expect(groups[0]?.options[0]).toEqual({
      value: "tz",
      label: "Tanzania",
    });
  });
});
