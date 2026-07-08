import { describe, expect, it } from "vitest";

import { hasSupplierXeroId } from "../supplierXeroId";

describe("hasSupplierXeroId", () => {
  it("returns false for null, undefined, empty, and whitespace-only", () => {
    expect(hasSupplierXeroId(null)).toBe(false);
    expect(hasSupplierXeroId(undefined)).toBe(false);
    expect(hasSupplierXeroId("")).toBe(false);
    expect(hasSupplierXeroId("   ")).toBe(false);
  });

  it("returns true for non-empty trimmed value", () => {
    expect(hasSupplierXeroId("abc")).toBe(true);
    expect(hasSupplierXeroId("  x  ")).toBe(true);
  });
});
