import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMarginRulesListControls } from "../model/useMarginRulesListControls";

describe("useMarginRulesListControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces search and only applies values with at least three characters", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    act(() => {
      result.current.setSearchQuery("ab");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.appliedSearch).toBeNull();
    expect(result.current.queryInput.search).toBeNull();

    act(() => {
      result.current.setSearchQuery("abc");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.appliedSearch).toBe("abc");
    expect(result.current.queryInput.search).toBe("abc");
  });

  it("clears dependent draft filters when supplier or service changes", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    act(() => {
      result.current.updateDraftFilter("supplierId", "sup-1");
      result.current.updateDraftFilter("serviceId", "service-1");
      result.current.updateDraftFilter("optionId", "option-1");
    });

    expect(result.current.draftFilters).toMatchObject({
      supplierId: "sup-1",
      serviceId: "service-1",
      optionId: "option-1",
    });

    act(() => {
      result.current.updateDraftFilter("supplierId", "sup-2");
    });

    expect(result.current.draftFilters).toMatchObject({
      supplierId: "sup-2",
      serviceId: null,
      optionId: null,
    });

    act(() => {
      result.current.updateDraftFilter("serviceId", "service-6");
      result.current.updateDraftFilter("optionId", "option-2");
      result.current.updateDraftFilter("serviceId", "service-7");
    });

    expect(result.current.draftFilters).toMatchObject({
      supplierId: "sup-2",
      serviceId: "service-7",
      optionId: null,
    });
  });

  it("applies, removes, and resets filters while keeping query input in sync", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    act(() => {
      result.current.updateDraftFilter("agencyGroupId", "ag-1");
      result.current.updateDraftFilter("supplierId", "sup-1");
      result.current.updateDraftFilter("validFrom", "2026-01-01");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters).toMatchObject({
      agencyGroupId: "ag-1",
      supplierId: "sup-1",
      validFrom: "2026-01-01",
    });
    expect(result.current.appliedFilterOrder).toEqual([
      "agencyGroupId",
      "supplierId",
      "validFrom",
    ]);
    expect(result.current.queryInput).toMatchObject({
      agencyGroupId: "ag-1",
      supplierId: "sup-1",
      validFrom: "2026-01-01",
    });

    act(() => {
      result.current.removeAppliedFilter("supplierId");
    });

    expect(result.current.appliedFilters.supplierId).toBeNull();
    expect(result.current.draftFilters.supplierId).toBeNull();

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.appliedFilters).toEqual({
      agencyGroupId: null,
      serviceTypeId: null,
      supplierId: null,
      serviceId: null,
      optionId: null,
      validFrom: null,
      validTo: null,
      marginPercent: "",
    });
    expect(result.current.appliedFilterOrder).toEqual([]);
    expect(result.current.hasAppliedFilters).toBe(false);
  });

  it("updates hideExpired instantly and toggles sort direction per column", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    expect(result.current.queryInput.hideExpired).toBe(false);
    expect(result.current.sortBy).toBe("agencyGroupName");
    expect(result.current.sortDirection).toBe("asc");

    act(() => {
      result.current.setHideExpired(true);
      result.current.toggleSort("supplierName");
    });

    expect(result.current.queryInput.hideExpired).toBe(true);
    expect(result.current.sortBy).toBe("supplierName");
    expect(result.current.sortDirection).toBe("asc");

    act(() => {
      result.current.toggleSort("supplierName");
    });

    expect(result.current.sortDirection).toBe("desc");
  });

  it("updates an applied filter inline and keeps draft and applied state aligned", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    act(() => {
      result.current.updateDraftFilter("agencyGroupId", "ag-1");
      result.current.applyFilters();
    });

    act(() => {
      result.current.updateAppliedFilter("agencyGroupId", "ag-2");
    });

    expect(result.current.appliedFilters.agencyGroupId).toBe("ag-2");
    expect(result.current.draftFilters.agencyGroupId).toBe("ag-2");
    expect(result.current.appliedFilterOrder).toEqual(["agencyGroupId"]);
  });

  it("keeps the hidden chips row open until it is manually closed", () => {
    const { result } = renderHook(() => useMarginRulesListControls());

    act(() => {
      result.current.updateDraftFilter("agencyGroupId", "ag-1");
      result.current.updateDraftFilter("supplierId", "sup-1");
      result.current.applyFilters();
      result.current.setShowHiddenChips(true);
    });

    act(() => {
      result.current.updateAppliedFilter("agencyGroupId", "ag-2");
    });

    expect(result.current.showHiddenChips).toBe(true);

    act(() => {
      result.current.removeAppliedFilter("supplierId");
    });

    expect(result.current.showHiddenChips).toBe(true);

    act(() => {
      result.current.updateDraftFilter("validFrom", "2026-01-01");
      result.current.applyFilters();
    });

    expect(result.current.showHiddenChips).toBe(true);
  });
});
