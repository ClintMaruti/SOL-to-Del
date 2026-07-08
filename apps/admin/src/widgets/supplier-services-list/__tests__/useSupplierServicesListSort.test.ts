import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SupplierService } from "@/entities/supplier-services";

import { useSupplierServicesListSort } from "../model/useSupplierServicesListSort";

const createService = (
  id: string,
  name: string,
  serviceTypeId: string,
  isActive: boolean,
  type: SupplierService["type"] = "other"
): SupplierService => ({
  id,
  supplierId: "sup-1",
  name,
  serviceTypeId,
  isActive,
  type,
  tags: "",
  options: [],
  rates: [],
  nominalSaleCode: null,
  purchaseNominalCode: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

const MOCK_ACCOMMODATION_ID = "14eeea9e-603e-41da-b77d-3c745e1e5da9";
const MOCK_ACTIVITY_ID = "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a";

const services: SupplierService[] = [
  createService("1", "Camp", MOCK_ACCOMMODATION_ID, true, "accommodation"),
  createService("2", "Game Drive", MOCK_ACTIVITY_ID, false, "activity"),
  createService("3", "Airport Transfer", MOCK_ACTIVITY_ID, true, "activity"),
];

describe("useSupplierServicesListSort", () => {
  it("should return services unchanged when no sort field", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    expect(result.current.sortState.field).toBeNull();
    expect(result.current.sortedServices).toEqual(services);
  });

  it("should sort by name ascending when toggling name", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    act(() => {
      result.current.toggleSort("serviceName");
    });

    expect(result.current.sortState.field).toBe("serviceName");
    expect(result.current.sortState.direction).toBe("asc");
    expect(result.current.sortedServices.map((s) => s.name)).toEqual([
      "Airport Transfer",
      "Camp",
      "Game Drive",
    ]);
  });

  it("should sort by name descending when toggling name twice", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    act(() => {
      result.current.toggleSort("serviceName");
    });
    act(() => {
      result.current.toggleSort("serviceName");
    });

    expect(result.current.sortState.direction).toBe("desc");
    expect(result.current.sortedServices.map((s) => s.name)).toEqual([
      "Game Drive",
      "Camp",
      "Airport Transfer",
    ]);
  });

  it("should sort by type", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    act(() => {
      result.current.toggleSort("type");
    });

    expect(result.current.sortState.field).toBe("type");
    expect(result.current.sortedServices.map((s) => s.type)).toEqual([
      "accommodation",
      "activity",
      "activity",
    ]);
  });

  it("should sort by isActive", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    act(() => {
      result.current.toggleSort("isActive");
    });

    expect(result.current.sortState.field).toBe("isActive");
    // false (0) before true (1) in ascending
    expect(result.current.sortedServices.map((s) => s.isActive)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("should set sort state when handleSort is called with key and direction", () => {
    const { result } = renderHook(() => useSupplierServicesListSort(services));

    act(() => {
      result.current.handleSort("serviceName", "desc");
    });

    expect(result.current.sortState.field).toBe("serviceName");
    expect(result.current.sortState.direction).toBe("desc");
    expect(result.current.sortedServices.map((s) => s.name)).toEqual([
      "Game Drive",
      "Camp",
      "Airport Transfer",
    ]);
  });
});
