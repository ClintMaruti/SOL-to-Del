import { afterAll, describe, expect, it, vi } from "vitest";

import type { ServiceEligibility } from "@/entities/service-eligibility";

import {
  buildServiceEligibilityPayload,
  duplicateEligibilityDraft,
  LOCAL_ELIG_PREFIX,
} from "../model/eligibility-drafts";
import type { EligibilityFormValues } from "../model/useEligibilityForm";

vi.stubGlobal("crypto", {
  randomUUID: vi
    .fn()
    .mockReturnValueOnce("elig-copy")
    .mockReturnValueOnce("validity-copy")
    .mockReturnValueOnce("group-copy")
    .mockReturnValueOnce("constraint-copy"),
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function eligibilityFixture(): ServiceEligibility {
  return {
    id: "eligibility-1",
    sequence: 1,
    name: "Eligibility 1",
    serviceId: "service-1",
    serviceName: "Service 1",
    isActive: true,
    validFrom: "",
    validTo: "",
    minAge: 12,
    totalPaxMin: 1,
    totalPaxMax: 4,
    unitsMin: 1,
    unitsMax: 2,
    nightsMin: 2,
    nightsMax: 5,
    validityDates: [
      {
        id: "validity-1",
        from: "2026-05-01",
        to: "2026-05-31",
        version: 3,
      },
    ],
    paxCompositionGroups: [
      {
        id: "group-1",
        version: 4,
        paxTypeConstraints: [
          {
            id: "constraint-1",
            paxType: "ADT",
            paxCode: "ADT",
            minCount: 1,
            maxCount: 2,
            version: 5,
            ageRestriction: {
              id: "age-1",
              ageMin: 18,
              ageMax: null,
              ruleMode: "all",
              version: 6,
            },
          },
        ],
      },
    ],
    version: 7,
  };
}

describe("service eligibility draft helpers", () => {
  it("duplicates an eligibility as an inactive local draft with copied nested data", () => {
    const duplicate = duplicateEligibilityDraft(
      eligibilityFixture(),
      "service-1",
      "Service 1",
      2,
      "Eligibility 2"
    );

    expect(duplicate).toMatchObject({
      id: `${LOCAL_ELIG_PREFIX}elig-copy`,
      name: "Eligibility 2",
      sequence: 2,
      isActive: false,
      version: 0,
      minAge: 12,
      totalPaxMax: 4,
    });
    expect(duplicate.validityDates[0]).toMatchObject({
      id: "vd-validity-copy",
      version: 0,
      from: "2026-05-01",
    });
    expect(duplicate.paxCompositionGroups[0]).toMatchObject({
      id: "pcg-group-copy",
      version: 0,
    });
    expect(
      duplicate.paxCompositionGroups[0]?.paxTypeConstraints[0]
    ).toMatchObject({
      id: "ptc-constraint-copy",
      version: 0,
      ageRestriction: {
        id: undefined,
        ageMin: 18,
        ruleMode: "all",
        version: 0,
      },
    });
  });

  it("builds service payloads and strips local nested ids", () => {
    const values: EligibilityFormValues = {
      isActive: false,
      validFrom: "",
      validTo: "",
      minimumAge: 8,
      totalPaxMin: 1,
      totalPaxMax: 3,
      unitsMin: null,
      unitsMax: null,
      nightsMin: null,
      nightsMax: null,
      validityDates: [
        {
          id: "vd-local",
          from: "2026-06-01",
          to: "2026-06-30",
          version: 0,
        },
      ],
      paxCompositionGroups: [
        {
          id: "pcg-local",
          version: 0,
          paxTypeConstraints: [
            {
              id: "ptc-local",
              paxType: "CHD",
              paxCode: "CHD",
              minCount: 1,
              maxCount: 2,
              version: 0,
              ageRestriction: {
                id: "age-persisted",
                ageMin: 6,
                ageMax: 12,
                ruleMode: "any",
                version: 1,
              },
            },
          ],
        },
      ],
    };

    const payload = buildServiceEligibilityPayload(
      "service-1",
      `${LOCAL_ELIG_PREFIX}1`,
      values,
      0
    );

    expect(payload).toMatchObject({
      id: undefined,
      serviceId: "service-1",
      minAge: 8,
      totalPaxMax: 3,
    });
    expect(payload).not.toHaveProperty("validFrom");
    expect(payload).not.toHaveProperty("validTo");
    expect(payload.validityDates[0]).not.toHaveProperty("id");
    expect(payload.paxCompositionGroups[0]).not.toHaveProperty("id");
    expect(
      payload.paxCompositionGroups[0]?.paxTypeConstraints[0]
    ).not.toHaveProperty("id");
    expect(
      payload.paxCompositionGroups[0]?.paxTypeConstraints[0]?.ageRestriction
    ).toMatchObject({ id: "age-persisted", ageMin: 6 });
  });
});
