import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  applyToggleToListOrEntityCache,
  updateToggleStatusListCaches,
} from "../toggleStatusQueryCache";

type Row = { id: string; isActive: boolean; name?: string };

describe("toggleStatusQueryCache", () => {
  describe("applyToggleToListOrEntityCache", () => {
    it("maps arrays and toggles matching id", () => {
      const toggle = (row: Row) =>
        row.id === "a" ? { ...row, isActive: !row.isActive } : row;
      const apply = applyToggleToListOrEntityCache(toggle);

      const list: Row[] = [
        { id: "a", isActive: true },
        { id: "b", isActive: true },
      ];
      expect(apply(list)).toEqual([
        { id: "a", isActive: false },
        { id: "b", isActive: true },
      ]);
    });

    it("toggles a single cached entity", () => {
      const toggle = (row: Row) =>
        row.id === "a" ? { ...row, isActive: !row.isActive } : row;
      const apply = applyToggleToListOrEntityCache(toggle);

      expect(apply({ id: "a", isActive: false })).toEqual({
        id: "a",
        isActive: true,
      });
    });

    it("returns unknown shapes unchanged", () => {
      const toggle = (row: Row) => row;
      const apply = applyToggleToListOrEntityCache(toggle);

      expect(apply(null)).toBe(null);
      expect(apply(undefined)).toBe(undefined);
    });
  });

  describe("updateToggleStatusListCaches", () => {
    it("updates root and prefixed list caches; skips detail second segment", () => {
      const qc = new QueryClient({
        defaultOptions: { queries: { gcTime: 0 } },
      });
      const entityId = "e1";
      const toggle = (row: Row) =>
        row.id === entityId ? { ...row, isActive: !row.isActive } : row;

      qc.setQueryData(
        ["rows"],
        [
          { id: entityId, isActive: true },
          { id: "other", isActive: true },
        ]
      );
      qc.setQueryData(["rows", "group-a"], [{ id: entityId, isActive: true }]);
      qc.setQueryData(["rows", entityId], {
        id: entityId,
        isActive: true,
        name: "Detail",
      });

      updateToggleStatusListCaches({
        queryClient: qc,
        rootQueryKey: ["rows"],
        entityId,
        toggle,
      });

      expect(qc.getQueryData(["rows"])).toEqual([
        { id: entityId, isActive: false },
        { id: "other", isActive: true },
      ]);
      expect(qc.getQueryData(["rows", "group-a"])).toEqual([
        { id: entityId, isActive: false },
      ]);
      expect(qc.getQueryData(["rows", entityId])).toEqual({
        id: entityId,
        isActive: true,
        name: "Detail",
      });
    });
  });
});
