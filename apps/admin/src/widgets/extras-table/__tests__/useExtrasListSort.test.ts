import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogExtra } from "@/entities/catalog-extra";

import { useExtrasListSort } from "../model/useExtrasListSort";

const sample: CatalogExtra[] = [
  {
    id: "a",
    title: "Zebra",
    description: "x",
    isActive: true,
  },
  {
    id: "b",
    title: "Alpha",
    description: null,
    isActive: false,
  },
];

describe("useExtrasListSort", () => {
  it("sorts by title ascending when handleSort is invoked", () => {
    const { result } = renderHook(() => useExtrasListSort(sample));

    act(() => {
      result.current.handleSort("title", "asc");
    });

    expect(result.current.sortedExtras.map((e) => e.title)).toEqual([
      "Alpha",
      "Zebra",
    ]);
  });

  it("sorts by description", () => {
    const { result } = renderHook(() => useExtrasListSort(sample));

    act(() => {
      result.current.handleSort("description", "asc");
    });

    expect(result.current.sortedExtras.map((e) => e.id)).toEqual(["b", "a"]);
  });
});
