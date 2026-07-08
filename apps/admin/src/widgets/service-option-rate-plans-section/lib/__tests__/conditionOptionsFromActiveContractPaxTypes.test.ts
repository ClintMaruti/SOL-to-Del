import { describe, expect, it } from "vitest";

import type {
  PaxType,
  SupplierPaxType,
} from "@/entities/supplier-pax-type-schedule";

import { conditionOptionsFromActiveSupplierPaxTypes } from "../conditionOptionsFromActiveContractPaxTypes";

function pax(paxType: PaxType, isActive: boolean): SupplierPaxType {
  return {
    id: `id-${paxType}`,
    paxType,
    name: paxType,
    code:
      paxType === "Adult"
        ? "ADT"
        : paxType === "Child"
          ? "CHD"
          : paxType === "Infant"
            ? "INF"
            : "YTH",
    ageFrom: 0,
    ageTo: 150,
    isActive,
    version: 1,
    isAdult: paxType === "Adult",
    isInfant: paxType === "Infant",
    canDeactivate: paxType !== "Adult",
    hasActiveDownstreamReferences: false,
  };
}

describe("conditionOptionsFromActiveSupplierPaxTypes", () => {
  it("returns only active pax types in Adult → Child → Infant → Teen order", () => {
    const result = conditionOptionsFromActiveSupplierPaxTypes([
      pax("Teen", false),
      pax("Infant", true),
      pax("Adult", true),
      pax("Child", true),
    ]);
    expect(result).toEqual(["ADT", "CHD", "INF"]);
  });

  it("includes Teen when active", () => {
    const result = conditionOptionsFromActiveSupplierPaxTypes([
      pax("Adult", true),
      pax("Child", true),
      pax("Infant", true),
      pax("Teen", true),
    ]);
    expect(result).toEqual(["ADT", "CHD", "INF", "YTH"]);
  });

  it("returns empty when no active types", () => {
    expect(
      conditionOptionsFromActiveSupplierPaxTypes([
        pax("Adult", false),
        pax("Child", false),
      ])
    ).toEqual([]);
  });
});
