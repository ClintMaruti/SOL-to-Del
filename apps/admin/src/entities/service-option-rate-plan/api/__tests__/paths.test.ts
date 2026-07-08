import { describe, expect, it } from "vitest";

import {
  catalogRateRuleResidenciesUrl,
  catalogRateRuleUrl,
  catalogServiceRatePlanActivateUrl,
  catalogServiceRatePlanByIdUrl,
  catalogServiceRatePlanDeactivateUrl,
  ratePlanRateRulesUrl,
  serviceRatePlansUrl,
} from "../paths";

describe("service-option-rate-plan paths", () => {
  it("serviceRatePlansUrl generates service-level list/create route", () => {
    expect(serviceRatePlansUrl("svc-1")).toBe(
      "/catalog/services/svc-1/rate-plans"
    );
  });

  it("catalogServiceRatePlanByIdUrl uses services/rate-plans/{id}", () => {
    expect(catalogServiceRatePlanByIdUrl("rp-1")).toBe(
      "/catalog/services/rate-plans/rp-1"
    );
  });

  it("catalogServiceRatePlanActivateUrl appends /activate", () => {
    expect(catalogServiceRatePlanActivateUrl("rp-1")).toBe(
      "/catalog/services/rate-plans/rp-1/activate"
    );
  });

  it("catalogServiceRatePlanDeactivateUrl appends /deactivate", () => {
    expect(catalogServiceRatePlanDeactivateUrl("rp-1")).toBe(
      "/catalog/services/rate-plans/rp-1/deactivate"
    );
  });

  it("ratePlanRateRulesUrl generates rate-rules list/create route under rate plan", () => {
    expect(ratePlanRateRulesUrl("rp-1")).toBe(
      "/catalog/services/rate-plans/rp-1/rate-rules"
    );
  });

  it("catalogRateRuleUrl generates individual rate rule route", () => {
    expect(catalogRateRuleUrl("rr-1")).toBe("/catalog/rate-rules/rr-1");
  });

  it("catalogRateRuleResidenciesUrl generates residencies lookup route", () => {
    expect(catalogRateRuleResidenciesUrl()).toBe(
      "/catalog/rate-rules/residencies"
    );
  });
});
