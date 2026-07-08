import {
  Car,
  DollarSign,
  Hotel,
  Package,
  FootprintsIcon,
  Plane,
} from "lucide-react";
import { describe, expect, it } from "vitest";

import { getServiceTypeConfig } from "../lib/service-type-config";

describe("getServiceTypeConfig", () => {
  it("should return correct config for accommodation", () => {
    const config = getServiceTypeConfig("accommodation");
    expect(config.icon).toBe(Hotel);
    expect(config.color).toBe("text-emerald-600");
  });

  it("should return correct config for activity", () => {
    const config = getServiceTypeConfig("activity");
    expect(config.icon).toBe(FootprintsIcon);
    expect(config.color).toBe("text-violet-600");
  });

  it("should return correct config for transportation", () => {
    const config = getServiceTypeConfig("transportation");
    expect(config.icon).toBe(Car);
    expect(config.color).toBe("text-yellow-600");
  });

  it("should return correct config for flight", () => {
    const config = getServiceTypeConfig("flight");
    expect(config.icon).toBe(Plane);
    expect(config.color).toBe("text-sky-600");
  });

  it("should return correct config for other", () => {
    const config = getServiceTypeConfig("other");
    expect(config.icon).toBe(Package);
    expect(config.color).toBe("text-slate-700");
  });

  it("should fall back to other config for unknown type", () => {
    const config = getServiceTypeConfig("unknown");
    expect(config.icon).toBe(Package);
    expect(config.color).toBe("text-slate-700");
  });

  it("should return correct config for fee", () => {
    const config = getServiceTypeConfig("fee");
    expect(config.icon).toBe(DollarSign);
    expect(config.color).toBe("text-amber-600");
  });

  it("should fall back to other config for empty string", () => {
    const config = getServiceTypeConfig("");
    expect(config.icon).toBe(Package);
    expect(config.color).toBe("text-slate-700");
  });
});
