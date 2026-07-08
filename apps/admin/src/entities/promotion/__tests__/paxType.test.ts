import { describe, expect, it } from "vitest";

import { toPromotionDetailPaxType, toPromotionFormPaxCode } from "../index";

describe("promotion pax type mappers", () => {
  it("maps API pax labels to form pax codes", () => {
    expect(toPromotionFormPaxCode("Adult")).toBe("ADT");
    expect(toPromotionFormPaxCode("Child")).toBe("CHD");
    expect(toPromotionFormPaxCode("Infant")).toBe("INF");
    expect(toPromotionFormPaxCode("Teen")).toBe("YTH");
    expect(toPromotionFormPaxCode("Youth")).toBe("YTH");
    expect(toPromotionFormPaxCode(null)).toBe("ANY");
  });

  it("maps form pax codes back to API pax labels", () => {
    expect(toPromotionDetailPaxType("ADT")).toBe("Adult");
    expect(toPromotionDetailPaxType("CHD")).toBe("Child");
    expect(toPromotionDetailPaxType("INF")).toBe("Infant");
    expect(toPromotionDetailPaxType("YTH")).toBe("Teen");
    expect(toPromotionDetailPaxType("ANY")).toBeNull();
    expect(toPromotionDetailPaxType(null)).toBeNull();
  });
});
