import { describe, expect, it } from "vitest";

import {
  buildCountrySelectOptionGroups,
  buildCountrySelectOptions,
  COUNTRIES,
  resolveToIsoOfficialCountryName,
} from "../countries";

describe("resolveToIsoOfficialCountryName", () => {
  it("normalizes common country labels to ISO official names", () => {
    expect(resolveToIsoOfficialCountryName("Tanzania")).toBe(
      "United Republic of Tanzania"
    );
    expect(resolveToIsoOfficialCountryName("Kenya")).toBe("Kenya");
  });
});

describe("buildCountrySelectOptionGroups", () => {
  it("puts resolved destination countries in the first group (A→Z) and the rest alphabetically in the second", () => {
    const { destinationCountries, otherCountries } =
      buildCountrySelectOptionGroups(["Kenya", "Tanzania", "South Africa"]);

    expect(destinationCountries.map((o) => o.value)).toEqual([
      "Kenya",
      "South Africa",
      "United Republic of Tanzania",
    ]);

    const destValues = new Set(destinationCountries.map((o) => o.value));
    const expectedOther = COUNTRIES.filter((c) => !destValues.has(c.name)).map(
      (c) => ({ value: c.name, label: c.name })
    );
    expect(otherCountries).toEqual(expectedOther);
  });

  it("when no preferred countries, destination group is empty and other is full list", () => {
    const { destinationCountries, otherCountries } =
      buildCountrySelectOptionGroups([]);
    expect(destinationCountries).toEqual([]);
    expect(otherCountries).toEqual(
      COUNTRIES.map((c) => ({ value: c.name, label: c.name }))
    );
  });

  it("does not duplicate a country across groups", () => {
    const { destinationCountries, otherCountries } =
      buildCountrySelectOptionGroups(["Kenya"]);
    const allValues = [
      ...destinationCountries.map((o) => o.value),
      ...otherCountries.map((o) => o.value),
    ];
    expect(new Set(allValues).size).toBe(allValues.length);
    expect(allValues.length).toBe(COUNTRIES.length);
  });
});

describe("buildCountrySelectOptions", () => {
  it("places resolved destination ISO countries first (A→Z), then full alphabetical list", () => {
    const options = buildCountrySelectOptions([
      "Kenya",
      "Tanzania",
      "South Africa",
    ]);

    expect(options[0]).toEqual({ value: "Kenya", label: "Kenya" });
    expect(options[1]).toEqual({
      value: "South Africa",
      label: "South Africa",
    });
    expect(options[2]).toEqual({
      value: "United Republic of Tanzania",
      label: "United Republic of Tanzania",
    });

    const destValues = new Set([
      "Kenya",
      "South Africa",
      "United Republic of Tanzania",
    ]);
    const rest = COUNTRIES.filter((c) => !destValues.has(c.name)).map((c) => ({
      value: c.name,
      label: c.name,
    }));
    expect(options.slice(3)).toEqual(rest);
  });

  it("sorts resolved segment A→Z regardless of input order", () => {
    const options = buildCountrySelectOptions([
      "South Africa",
      "Kenya",
      "Tanzania",
    ]);

    expect(options[0].value).toBe("Kenya");
    expect(options[1].value).toBe("South Africa");
    expect(options[2].value).toBe("United Republic of Tanzania");
  });

  it("lists other resolved destination countries alphabetically in the first segment", () => {
    const options = buildCountrySelectOptions(["Zambia", "Kenya", "Uganda"]);

    expect(options[0].value).toBe("Kenya");
    expect(options[1].value).toBe("Uganda");
    expect(options[2].value).toBe("Zambia");
  });

  it("ignores preferred names that cannot be resolved to an ISO country", () => {
    const options = buildCountrySelectOptions(["NotACountry", "Kenya"]);
    expect(options[0]).toEqual({ value: "Kenya", label: "Kenya" });
    expect(options.length).toBe(COUNTRIES.length);
  });

  it("dedupes preferred list and matches empty preferred to alphabetical-only", () => {
    const onlyAlphabetical = buildCountrySelectOptions([]);
    expect(onlyAlphabetical).toEqual(
      COUNTRIES.map((c) => ({ value: c.name, label: c.name }))
    );

    const deduped = buildCountrySelectOptions(["Kenya", "Kenya"]);
    expect(deduped[0]).toEqual({ value: "Kenya", label: "Kenya" });
    expect(deduped.filter((o) => o.value === "Kenya").length).toBe(1);
  });
});
