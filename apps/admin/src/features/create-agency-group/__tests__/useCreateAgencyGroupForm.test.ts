import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  INITIAL_FORM_DATA,
  useCreateAgencyGroupForm,
  type CreateAgencyGroupFormData,
} from "../model/useCreateAgencyGroupForm";

describe("useCreateAgencyGroupForm", () => {
  describe("Initialization", () => {
    it("should return form with default values when no initialData provided", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      expect(result.current.form.state.values).toEqual(INITIAL_FORM_DATA);
      expect(result.current.isDirty).toBe(false);
    });

    it("should use provided initialData", () => {
      const initialData: CreateAgencyGroupFormData = {
        name: "Test Group",
        description: "Test description",
        agencies: ["agency-1", "agency-2"],
      };

      const { result } = renderHook(() =>
        useCreateAgencyGroupForm(initialData)
      );

      expect(result.current.form.state.values).toEqual(initialData);
      expect(result.current.isDirty).toBe(false);
    });

    it("should handle null initialData as empty form", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm(null));

      expect(result.current.form.state.values).toEqual(INITIAL_FORM_DATA);
    });

    it("should handle undefined initialData as empty form", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm(undefined));

      expect(result.current.form.state.values).toEqual(INITIAL_FORM_DATA);
    });

    it("should not reset when initialData is value-equivalent with a new reference", () => {
      const initialData: CreateAgencyGroupFormData = {
        name: "Test Group",
        description: "Test description",
        agencies: ["agency-1"],
      };

      const { result, rerender } = renderHook(
        ({ data }: { data: CreateAgencyGroupFormData }) =>
          useCreateAgencyGroupForm(data),
        { initialProps: { data: initialData } }
      );

      act(() => {
        result.current.form.setFieldValue("name", "User edit");
      });

      rerender({
        data: { ...initialData, agencies: [...initialData.agencies] },
      });

      expect(result.current.form.state.values.name).toBe("User edit");
    });
  });

  describe("isDirty", () => {
    it("should be false when form values match initial data", () => {
      const initialData: CreateAgencyGroupFormData = {
        name: "Test",
        description: "",
        agencies: [],
      };
      const { result } = renderHook(() =>
        useCreateAgencyGroupForm(initialData)
      );

      expect(result.current.isDirty).toBe(false);
    });

    it("should be true when form values are modified", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      act(() => {
        result.current.form.setFieldValue("name", "New Name");
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should be true when description is modified", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      act(() => {
        result.current.form.setFieldValue("description", "New desc");
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should be true when agencies are modified", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      act(() => {
        result.current.form.setFieldValue("agencies", ["agency-1"]);
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset to initialData when no argument provided", () => {
      const initialData: CreateAgencyGroupFormData = {
        name: "Original",
        description: "Desc",
        agencies: ["ag-1"],
      };
      const { result } = renderHook(() =>
        useCreateAgencyGroupForm(initialData)
      );

      act(() => {
        result.current.form.setFieldValue("name", "Modified");
      });
      expect(result.current.form.state.values.name).toBe("Modified");

      act(() => {
        result.current.reset();
      });
      expect(result.current.form.state.values).toEqual(initialData);
    });

    it("should reset to provided data when argument provided", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      const newData: CreateAgencyGroupFormData = {
        name: "Fresh",
        description: "Fresh desc",
        agencies: ["ag-x"],
      };

      act(() => {
        result.current.reset(newData);
      });

      expect(result.current.form.state.values).toEqual(newData);
    });

    it("should reset to INITIAL_FORM_DATA when called with undefined and no initialData", () => {
      const { result } = renderHook(() => useCreateAgencyGroupForm());

      act(() => {
        result.current.form.setFieldValue("name", "Dirty");
      });

      act(() => {
        result.current.reset(undefined);
      });

      expect(result.current.form.state.values).toEqual(INITIAL_FORM_DATA);
    });
  });

  describe("INITIAL_FORM_DATA", () => {
    it("should match expected shape", () => {
      expect(INITIAL_FORM_DATA).toEqual({
        name: "",
        description: "",
        agencies: [],
      });
    });
  });
});
