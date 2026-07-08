import { describe, expect, it } from "vitest";

import { computeSubmitErrors } from "../model/computeFieldErrors";

const t = (key: string, params?: Record<string, string | number>) =>
  params?.field ? `${key}:${params.field}` : key;

const emptyCapacity = {
  totalPaxMin: null,
  totalPaxMax: null,
  unitsMin: null,
  unitsMax: null,
  nightsMin: null,
  nightsMax: null,
  minimumAge: null,
};

describe("service eligibility submit validation", () => {
  it("blocks a negative generic minimum age", () => {
    const errors = computeSubmitErrors(
      t as never,
      {
        ...emptyCapacity,
        minimumAge: -1,
      },
      [],
      []
    );

    expect(errors).toEqual([
      "validation.fieldMustBeZeroOrGreater:labels.minimumAge",
    ]);
  });

  it("blocks inverted capacity and validity date ranges", () => {
    const errors = computeSubmitErrors(
      t as never,
      {
        ...emptyCapacity,
        totalPaxMin: 4,
        totalPaxMax: 2,
      },
      [
        {
          id: "validity-1",
          from: "2026-05-20",
          to: "2026-05-19",
          version: 0,
        },
      ],
      []
    );

    expect(errors).toContain("errors.fieldMinGreaterThanMax:sections.totalPax");
    expect(errors).toContain("errors.startDateAfterEndDate");
  });

  it("blocks pax max above the eligibility total pax max", () => {
    const errors = computeSubmitErrors(
      t as never,
      {
        ...emptyCapacity,
        totalPaxMax: 2,
      },
      [],
      [
        {
          id: "group-1",
          version: 0,
          paxTypeConstraints: [
            {
              id: "constraint-1",
              paxType: "ADT",
              paxCode: "ADT",
              minCount: 1,
              maxCount: 3,
              version: 0,
            },
          ],
        },
      ]
    );

    expect(errors).toContain("errors.paxMaxExceedsTotalMax");
  });

  it("requires age rule mode when an age bound is configured", () => {
    const errors = computeSubmitErrors(
      t as never,
      emptyCapacity,
      [],
      [
        {
          id: "group-1",
          version: 0,
          paxTypeConstraints: [
            {
              id: "constraint-1",
              paxType: "CHD",
              paxCode: "CHD",
              minCount: 1,
              maxCount: 1,
              version: 0,
              ageRestriction: {
                ageMin: 6,
                ageMax: null,
                ruleMode: "",
                version: 0,
              },
            },
          ],
        },
      ]
    );

    expect(errors).toContain("errors.ageRuleModeRequired:CHD");
  });

  it("blocks age min greater than age max", () => {
    const errors = computeSubmitErrors(
      t as never,
      emptyCapacity,
      [],
      [
        {
          id: "group-1",
          version: 0,
          paxTypeConstraints: [
            {
              id: "constraint-1",
              paxType: "INF",
              paxCode: "INF",
              minCount: 1,
              maxCount: 1,
              version: 0,
              ageRestriction: {
                ageMin: 4,
                ageMax: 2,
                ruleMode: "all",
                version: 0,
              },
            },
          ],
        },
      ]
    );

    expect(errors).toContain("errors.fieldMinAgeGreaterThanMax:INF");
  });
});
