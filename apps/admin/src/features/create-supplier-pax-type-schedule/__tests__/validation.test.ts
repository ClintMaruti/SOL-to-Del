import { describe, expect, it } from "vitest";

import {
  ageRangesOverlap,
  validateSupplierPaxTypes,
} from "../model/validation";
import type { AddPaxConfigurationFormValues } from "../model/types";

function values(
  overrides: Partial<AddPaxConfigurationFormValues> = {}
): AddPaxConfigurationFormValues {
  return {
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
    ...overrides,
  };
}

describe("validateSupplierPaxTypes", () => {
  it("requires Valid From", () => {
    const result = validateSupplierPaxTypes(values({ validFrom: "" }));

    expect(result.isValid).toBe(false);
    expect(result.validFrom).toBe("Valid From is required.");
    expect(result.form).toContain("Valid From is required.");
  });

  it("allows an adult Age To above 99", () => {
    expect(validateSupplierPaxTypes(values()).isValid).toBe(true);
  });

  it("requires age ranges only for active pax types", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Child" ? { ...row, ageFrom: "", ageTo: "" } : row
        ),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain(
      "Age range is required for active Pax Types."
    );
    expect(result.paxTypes.Child?.ageFrom).toBe(
      "Age range is required for active Pax Types."
    );
    expect(result.paxTypes.Child?.ageTo).toBe(
      "Age range is required for active Pax Types."
    );
  });

  it("blocks active age ranges where Age From is not less than Age To", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Child" ? { ...row, ageFrom: "17", ageTo: "17" } : row
        ),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain("Age From must be less than Age To.");
    expect(result.paxTypes.Child?.ageFrom).toBe(
      "Age From must be less than Age To."
    );
    expect(result.paxTypes.Child?.ageTo).toBe(
      "Age From must be less than Age To."
    );
  });

  it("blocks inclusive overlaps between active pax types", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Teen"
            ? { ...row, ageFrom: "17", ageTo: "18", isActive: true }
            : row
        ),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain(
      "Age ranges must not overlap across active Pax Types."
    );
    expect(result.paxTypes.Child?.ageFrom).toBe(
      "Age ranges must not overlap across active Pax Types."
    );
    expect(result.paxTypes.Teen?.ageTo).toBe(
      "Age ranges must not overlap across active Pax Types."
    );
  });

  it("checks every active pair for overlap, including ranges hidden by a wider range", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) => {
          if (row.paxType === "Adult") {
            return { ...row, ageFrom: "0", ageTo: "999" };
          }
          if (row.paxType === "Infant") {
            return { ...row, ageFrom: "0", ageTo: "1", isActive: true };
          }
          if (row.paxType === "Child") {
            return { ...row, ageFrom: "2", ageTo: "17", isActive: true };
          }
          return row;
        }),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain(
      "Age ranges must not overlap across active Pax Types."
    );
    expect(result.paxTypes.Adult?.ageFrom).toBe(
      "Age ranges must not overlap across active Pax Types."
    );
    expect(result.paxTypes.Child?.ageTo).toBe(
      "Age ranges must not overlap across active Pax Types."
    );
  });

  it("does not validate inactive pax type age gaps or overlaps", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Child"
            ? { ...row, ageFrom: "18", ageTo: "999", isActive: false }
            : row
        ),
      })
    );

    expect(result.isValid).toBe(true);
  });

  it("requires Adult to stay active and cover the highest active age boundary", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Adult" ? { ...row, ageFrom: "0", ageTo: "16" } : row
        ),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain("Adult must cover the highest age boundary.");
  });

  it("blocks attempts to deactivate Adult", () => {
    const result = validateSupplierPaxTypes(
      values({
        paxTypes: values().paxTypes.map((row) =>
          row.paxType === "Adult" ? { ...row, isActive: false } : row
        ),
      })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain("Adult cannot be deactivated.");
    expect(result.paxTypes.Adult?.isActive).toBe(
      "Adult cannot be deactivated."
    );
  });

  it("blocks Valid To before Valid From", () => {
    const result = validateSupplierPaxTypes(
      values({ validFrom: "2026-06-01", validTo: "2026-05-31" })
    );

    expect(result.isValid).toBe(false);
    expect(result.form).toContain("End date must be on or after start date.");
  });
});

describe("ageRangesOverlap", () => {
  it("uses inclusive age boundaries", () => {
    expect(ageRangesOverlap(2, 11, 11, 18)).toBe(true);
    expect(ageRangesOverlap(2, 11, 12, 18)).toBe(false);
  });
});
