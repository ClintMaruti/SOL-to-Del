import { describe, expect, it } from "vitest";

import {
  getActiveSupplierPaxTypesForDate,
  normalizeSupplierPaxTypeSchedule,
  sortSupplierPaxTypeSchedules,
  type SupplierPaxTypeSchedule,
} from "../model/types";

describe("supplier pax type schedule types", () => {
  it("normalizes derived flags and row order", () => {
    const schedule = normalizeSupplierPaxTypeSchedule({
      id: "schedule-1",
      supplierId: "sup-1",
      validFrom: "2026-01-01",
      validTo: null,
      paxTypes: [
        {
          id: "yth",
          name: "Teen",
          paxType: "Teen",
          isActive: false,
        },
        {
          id: "adt",
          name: "Adult",
          paxType: "Adult",
          ageFrom: 18,
          ageTo: 999,
          isActive: false,
        },
      ],
    });

    expect(schedule.paxTypes.map((row) => row.paxType)).toEqual([
      "Adult",
      "Teen",
    ]);
    expect(schedule.paxTypes[0]).toMatchObject({
      isActive: true,
      isAdult: true,
      canDeactivate: false,
    });
  });

  it("sorts schedules newest first and resolves active rows by date", () => {
    const schedules: SupplierPaxTypeSchedule[] = [
      {
        id: "old",
        supplierId: "sup-1",
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
        paxTypes: [],
      },
      {
        id: "current",
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: null,
        paxTypes: [
          {
            id: "adt",
            name: "Adult",
            paxType: "Adult",
            code: "ADT",
            ageFrom: 18,
            ageTo: 999,
            isActive: true,
            isAdult: true,
            isInfant: false,
            canDeactivate: false,
            hasActiveDownstreamReferences: false,
          },
        ],
      },
    ];

    expect(
      sortSupplierPaxTypeSchedules(schedules).map((row) => row.id)
    ).toEqual(["current", "old"]);
    expect(
      getActiveSupplierPaxTypesForDate(schedules, "2026-04-01")
    ).toHaveLength(1);
  });
});
