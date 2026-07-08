import { describe, expect, it } from "vitest";

import type { SupplierPaxTypeSchedule } from "@/entities/supplier-pax-type-schedule";

import {
  mapCreateSupplierPaxTypeSchedulePayload,
  mapUpdateSupplierPaxTypeSchedulePayload,
} from "../model/payloadMappers";
import type { AddPaxConfigurationFormValues } from "../model/types";

describe("supplier pax payload mappers", () => {
  it("creates all four canonical pax rows and preserves inactive empty ages", () => {
    const values: AddPaxConfigurationFormValues = {
      validFrom: "2026-01-01",
      validTo: "",
      paxTypes: [
        {
          name: "Adult",
          paxType: "Adult",
          ageFrom: "18",
          ageTo: "999",
          isActive: true,
        },
        {
          name: "Child",
          paxType: "Child",
          ageFrom: "2",
          ageTo: "17",
          isActive: true,
        },
        {
          name: "Infant",
          paxType: "Infant",
          ageFrom: "",
          ageTo: "",
          isActive: false,
        },
        {
          name: "Teen",
          paxType: "Teen",
          ageFrom: "",
          ageTo: "",
          isActive: false,
        },
      ],
    };

    const payload = mapCreateSupplierPaxTypeSchedulePayload("sup-1", values);

    expect(payload).toMatchObject({
      supplierId: "sup-1",
      validFrom: "2026-01-01",
      validTo: null,
    });
    expect(payload.paxTypes).toEqual([
      {
        name: "Adult",
        paxType: "Adult",
        ageFrom: 18,
        ageTo: 999,
        isActive: true,
      },
      {
        name: "Child",
        paxType: "Child",
        ageFrom: 2,
        ageTo: 17,
        isActive: true,
      },
      {
        name: "Infant",
        paxType: "Infant",
        ageFrom: null,
        ageTo: null,
        isActive: false,
      },
      {
        name: "Teen",
        paxType: "Teen",
        ageFrom: null,
        ageTo: null,
        isActive: false,
      },
    ]);
  });

  it("maps update payload by changing only ValidTo schedule fields and keeping versions", () => {
    const schedule: SupplierPaxTypeSchedule = {
      id: "schedule-1",
      supplierId: "sup-1",
      validFrom: "2026-01-01",
      validTo: null,
      version: 4,
      paxTypes: [
        {
          id: "pax-adt",
          name: "Adult",
          paxType: "Adult",
          code: "ADT",
          ageFrom: 18,
          ageTo: 999,
          isActive: true,
          version: 2,
          isAdult: true,
          isInfant: false,
          canDeactivate: false,
          hasActiveDownstreamReferences: false,
        },
      ],
    };

    expect(
      mapUpdateSupplierPaxTypeSchedulePayload(schedule, "2026-12-31")
    ).toEqual({
      id: "schedule-1",
      supplierId: "sup-1",
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
      version: 4,
      paxTypes: [
        {
          id: "pax-adt",
          name: "Adult",
          paxType: "Adult",
          ageFrom: 18,
          ageTo: 999,
          isActive: true,
          version: 2,
        },
      ],
    });
  });
});
