import { describe, expect, it } from "vitest";

import { validateContractedRateForm } from "../model/contractedRateFormValidation";

const t = (key: string) => key;

describe("validateContractedRateForm", () => {
  it("returns season name error when season is empty", () => {
    const result = validateContractedRateForm({
      seasonName: "",
      priority: "100",
      dates: [
        {
          travelDateFrom: "2026-01-01",
          travelDateTo: "2026-01-31",
          weekdays: [],
        },
      ],
      priceRows: [
        {
          key: "opt:rate",
          checked: true,
          net: "10",
          rack: "20",
        },
      ],
      requireNetRackOnCheckedRows: true,
      t,
    });

    expect(result?.seasonName).toBe("validation.seasonNameRequired");
  });

  it("returns travel date error when dates are empty", () => {
    const result = validateContractedRateForm({
      seasonName: "Summer",
      priority: "100",
      dates: [{ travelDateFrom: "", travelDateTo: "", weekdays: [] }],
      priceRows: [
        {
          key: "opt:rate",
          checked: true,
          net: "10",
          rack: "20",
        },
      ],
      requireNetRackOnCheckedRows: true,
      t,
    });

    expect(result?.dateRows[0]).toBe("validation.travelDatesCannotBeEmpty");
  });

  it("returns net and rack errors for checked rows on create", () => {
    const result = validateContractedRateForm({
      seasonName: "Summer",
      priority: "100",
      dates: [
        {
          travelDateFrom: "2026-01-01",
          travelDateTo: "2026-01-31",
          weekdays: [],
        },
      ],
      priceRows: [
        {
          key: "opt:rate",
          checked: true,
          net: "",
          rack: "",
        },
      ],
      requireNetRackOnCheckedRows: true,
      t,
    });

    expect(result?.priceRows["opt:rate"]?.net).toBe("validation.netRequired");
    expect(result?.priceRows["opt:rate"]?.rack).toBe("validation.rackRequired");
  });
});
