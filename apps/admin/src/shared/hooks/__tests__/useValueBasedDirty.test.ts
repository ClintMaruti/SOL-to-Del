import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useValueBasedDirty } from "../useValueBasedDirty";

type TestFormData = { name: string; preferred: boolean };

const DEFAULT_INITIAL: TestFormData = {
  name: "",
  preferred: false,
};

const FORM_KEYS: (keyof TestFormData)[] = ["name", "preferred"];

describe("useValueBasedDirty", () => {
  describe("create mode (no initialData)", () => {
    it("is not dirty after mount when current values match defaultInitial", async () => {
      const currentValues = { ...DEFAULT_INITIAL };

      const { result } = renderHook(() =>
        useValueBasedDirty<TestFormData>(
          currentValues,
          null,
          FORM_KEYS,
          DEFAULT_INITIAL
        )
      );

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });

    it("becomes dirty when a value changes from the default", async () => {
      const { result, rerender } = renderHook(
        ({ values }: { values: TestFormData }) =>
          useValueBasedDirty<TestFormData>(
            values,
            null,
            FORM_KEYS,
            DEFAULT_INITIAL
          ),
        { initialProps: { values: { ...DEFAULT_INITIAL } } }
      );

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });

      act(() => {
        rerender({ values: { name: "Acme", preferred: false } });
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("reset() updates baseline so form is not dirty", async () => {
      const { result, rerender } = renderHook(
        ({ values }: { values: TestFormData }) =>
          useValueBasedDirty<TestFormData>(
            values,
            null,
            FORM_KEYS,
            DEFAULT_INITIAL
          ),
        {
          initialProps: {
            values: { name: "Changed", preferred: true },
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      act(() => {
        result.current.reset({ ...DEFAULT_INITIAL });
      });

      act(() => {
        rerender({ values: { ...DEFAULT_INITIAL } });
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("edit mode (initialData provided)", () => {
    it("is not dirty when current values match initialData", async () => {
      const initialData: TestFormData = { name: "Original", preferred: true };
      const currentValues = { ...initialData };

      const { result } = renderHook(() =>
        useValueBasedDirty<TestFormData>(
          currentValues,
          initialData,
          FORM_KEYS,
          DEFAULT_INITIAL
        )
      );

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });

    it("becomes dirty only after form has matched initialData at least once", async () => {
      const initialData: TestFormData = { name: "Original", preferred: true };
      // Simulate stale store: current values differ from initialData on first render
      const { result, rerender } = renderHook(
        ({ values }: { values: TestFormData }) =>
          useValueBasedDirty<TestFormData>(
            values,
            initialData,
            FORM_KEYS,
            DEFAULT_INITIAL
          ),
        {
          initialProps: {
            values: { name: "", preferred: false },
          },
        }
      );

      // Should not be dirty yet (hasSeenFormMatchingInitial is false)
      expect(result.current.isDirty).toBe(false);

      // Form "catches up" to initialData
      act(() => {
        rerender({ values: { ...initialData } });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });

      // User edits
      act(() => {
        rerender({ values: { name: "Modified", preferred: true } });
      });

      expect(result.current.isDirty).toBe(true);
    });
  });
});
