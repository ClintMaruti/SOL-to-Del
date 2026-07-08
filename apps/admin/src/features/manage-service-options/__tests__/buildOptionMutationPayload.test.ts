import { describe, expect, it } from "vitest";

import {
  buildCreateServiceOptionBody,
  buildUpdateServiceOptionPayload,
} from "../model/buildOptionMutationPayload";
import { createEmptyOperatingDaySelection } from "../model/operating-days";
import type { OptionFormValues } from "../model/useOptionForm";

function baseValues(
  overrides: Partial<OptionFormValues> = {}
): OptionFormValues {
  return {
    title: "Morning Flight",
    includes: "",
    excludes: "",
    contractId: null,
    isActive: true,
    timeFrom: "10:00 AM",
    timeTo: "12:00 PM",
    flightNumber: "AR1",
    operatingDaySelected: [true, false, true, false, false, false, false],
    ...overrides,
  };
}

describe("buildCreateServiceOptionBody", () => {
  it("sends flightOption for flight service type", () => {
    const body = buildCreateServiceOptionBody("flight", baseValues());
    expect(body.flightOption).toEqual({
      operatingDays: ["MON", "WED"],
      timeFrom: "10:00 AM",
      timeTo: "12:00 PM",
      flightNumber: "AR1",
    });
    expect(body.activityOption).toBeUndefined();
    expect(body.transportOption).toBeUndefined();
  });

  it("sends transportOption for transportation", () => {
    const body = buildCreateServiceOptionBody(
      "transportation",
      baseValues({ flightNumber: "" })
    );
    expect(body.transportOption).toEqual({
      operatingDays: ["MON", "WED"],
      timeFrom: "10:00 AM",
      timeTo: "12:00 PM",
    });
    expect(body.flightOption).toBeUndefined();
  });

  it("omits nested option blocks for accommodation on create", () => {
    const body = buildCreateServiceOptionBody("accommodation", baseValues());
    expect(body.title).toBe("Morning Flight");
    expect(body.accommodationOption).toBeUndefined();
    expect(body.flightOption).toBeUndefined();
  });

  it("omits activity operatingDays when optional values are cleared", () => {
    const body = buildCreateServiceOptionBody(
      "activity",
      baseValues({
        timeFrom: "",
        timeTo: "",
        operatingDaySelected: createEmptyOperatingDaySelection(),
      })
    );
    expect(body.activityOption).toEqual({});
    expect(body.activityOption).not.toHaveProperty("operatingDays");
    expect(JSON.stringify(body)).not.toContain("allDays");
  });

  it("omits transport operatingDays when no days are selected", () => {
    const body = buildCreateServiceOptionBody(
      "transportation",
      baseValues({
        operatingDaySelected: createEmptyOperatingDaySelection(),
      })
    );
    expect(body.transportOption).toEqual({
      timeFrom: "10:00 AM",
      timeTo: "12:00 PM",
    });
    expect(body.transportOption).not.toHaveProperty("operatingDays");
  });
});

describe("buildUpdateServiceOptionPayload", () => {
  it("sends accommodationOption with option id for accommodation", () => {
    const payload = buildUpdateServiceOptionPayload(
      "accommodation",
      baseValues(),
      "opt-99",
      3
    );
    expect(payload.accommodationOption).toEqual({
      serviceOptionId: "opt-99",
    });
    expect(payload.version).toBe(3);
  });

  it("sends activityOption for activity type", () => {
    const payload = buildUpdateServiceOptionPayload(
      "activity",
      baseValues({
        operatingDaySelected: createEmptyOperatingDaySelection().map(
          (_, i) => i === 6
        ),
      }),
      "opt-1",
      1
    );
    expect(payload.activityOption).toEqual({
      operatingDays: ["SUN"],
      timeFrom: "10:00 AM",
      timeTo: "12:00 PM",
    });
  });

  it("normalizes 12h period casing on flight payload", () => {
    const body = buildCreateServiceOptionBody(
      "flight",
      baseValues({ timeFrom: "10:00 am", timeTo: "12:00 pm" })
    );
    expect(body.flightOption?.timeFrom).toBe("10:00 AM");
    expect(body.flightOption?.timeTo).toBe("12:00 PM");
  });

  it("preserves overnight-style time pairs on payload", () => {
    const body = buildCreateServiceOptionBody(
      "flight",
      baseValues({ timeFrom: "11:20 PM", timeTo: "12:15 AM" })
    );
    expect(body.flightOption?.timeFrom).toBe("11:20 PM");
    expect(body.flightOption?.timeTo).toBe("12:15 AM");
  });
});
