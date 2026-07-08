import { describe, expect, it } from "vitest";

import {
  INITIAL_RATE_PLAN,
  toFormValues,
  type RatePlanFormValues,
} from "../model/useRatePlanForm";
import type { RatePlan } from "@/entities/service-option-rate-plan";

describe("useRatePlanForm helpers", () => {
  describe("INITIAL_RATE_PLAN", () => {
    it("has null validityDateTo (optional field)", () => {
      expect(INITIAL_RATE_PLAN.validityDateTo).toBeNull();
    });

    it("has empty name and validityDateFrom", () => {
      expect(INITIAL_RATE_PLAN.name).toBe("");
      expect(INITIAL_RATE_PLAN.validityDateFrom).toBe("");
    });

    it("has payAtProperty false", () => {
      expect(INITIAL_RATE_PLAN.payAtProperty).toBe(false);
    });
  });

  describe("toFormValues", () => {
    it("maps RatePlan with null validityDateTo correctly", () => {
      const ratePlan: RatePlan = {
        id: "rp-1",
        serviceId: "svc-1",
        name: "STD",
        validityDateFrom: "2025-01-01",
        validityDateTo: null,
        payAtProperty: false,
        isActive: true,
        version: 2,
      };

      const result: RatePlanFormValues = toFormValues(ratePlan);

      expect(result.name).toBe("STD");
      expect(result.validityDateFrom).toBe("2025-01-01");
      expect(result.validityDateTo).toBeNull();
      expect(result.payAtProperty).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.version).toBe(2);
    });

    it("maps RatePlan with a set validityDateTo", () => {
      const ratePlan: RatePlan = {
        id: "rp-2",
        serviceId: "svc-1",
        name: "PKG",
        validityDateFrom: "2025-06-01",
        validityDateTo: "2025-12-31",
        payAtProperty: true,
        isActive: false,
        version: 5,
      };

      const result = toFormValues(ratePlan);

      expect(result.validityDateTo).toBe("2025-12-31");
      expect(result.payAtProperty).toBe(true);
    });
  });
});
