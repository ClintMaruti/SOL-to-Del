import { describe, expect, it } from "vitest";

import { createEmptyOperatingDaySelection } from "../model/operating-days";
import { optionFormSchema } from "../model/schema";
import type { OptionFormValues } from "../model/useOptionForm";
import { INITIAL_OPTION_FORM } from "../model/useOptionForm";

function validBase(
  overrides: Partial<OptionFormValues> = {}
): OptionFormValues {
  return {
    ...INITIAL_OPTION_FORM,
    title: "Valid option title",
    operatingDaySelected: createEmptyOperatingDaySelection().map((_, i) =>
      i === 0 ? true : false
    ),
    ...overrides,
  };
}

describe("optionFormSchema", () => {
  it("accepts a two-character option title", () => {
    const result = optionFormSchema.safeParse(validBase({ title: "FB" }));
    expect(result.success).toBe(true);
  });

  it("rejects a one-character option title", () => {
    const result = optionFormSchema.safeParse(validBase({ title: "F" }));
    expect(result.success).toBe(false);
  });

  it("rejects option titles longer than 200 characters", () => {
    const result = optionFormSchema.safeParse(
      validBase({ title: "A".repeat(201) })
    );
    expect(result.success).toBe(false);
  });

  it("rejects exactly one of timeFrom / timeTo filled", () => {
    const result = optionFormSchema.safeParse(
      validBase({ timeFrom: "9:00 AM", timeTo: "" })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("timeFrom");
      expect(paths).toContain("timeTo");
    }
  });

  it("accepts both times empty", () => {
    const result = optionFormSchema.safeParse(
      validBase({ timeFrom: "", timeTo: "" })
    );
    expect(result.success).toBe(true);
  });

  it("accepts both times valid 12h including overnight-style pairs", () => {
    const result = optionFormSchema.safeParse(
      validBase({ timeFrom: "11:20 PM", timeTo: "12:15 AM" })
    );
    expect(result.success).toBe(true);
  });

  it("rejects 24-hour-only strings when both times are set", () => {
    const result = optionFormSchema.safeParse(
      validBase({ timeFrom: "23:20", timeTo: "00:15" })
    );
    expect(result.success).toBe(false);
  });
});
