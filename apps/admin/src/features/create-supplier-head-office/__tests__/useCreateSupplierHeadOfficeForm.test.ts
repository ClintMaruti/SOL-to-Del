import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  INITIAL_FORM_DATA,
  useCreateSupplierHeadOfficeForm,
} from "../model/useCreateSupplierHeadOfficeForm";

describe("useCreateSupplierHeadOfficeForm", () => {
  it("should have empty initial state when no initialData", () => {
    const { result } = renderHook(() => useCreateSupplierHeadOfficeForm());

    expect(result.current.form.state.values).toEqual(INITIAL_FORM_DATA);
    expect(result.current.isDirty).toBe(false);
  });

  it("should reset to initial empty state", () => {
    const { result } = renderHook(() => useCreateSupplierHeadOfficeForm());

    act(() => {
      result.current.form.setFieldValue("name", "Test");
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.form.state.values.name).toBe("");
    expect(result.current.isDirty).toBe(false);
  });

  it("should accept initialData when provided", () => {
    const initial = {
      ...INITIAL_FORM_DATA,
      name: "Pre-filled",
      email: "pre@example.com",
    };
    const { result } = renderHook(() =>
      useCreateSupplierHeadOfficeForm(initial)
    );

    expect(result.current.form.state.values.name).toBe("Pre-filled");
    expect(result.current.form.state.values.email).toBe("pre@example.com");
  });
});
