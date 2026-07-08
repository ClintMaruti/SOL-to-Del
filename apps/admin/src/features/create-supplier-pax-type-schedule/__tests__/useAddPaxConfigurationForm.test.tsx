import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAddPaxConfigurationForm } from "../model/useAddPaxConfigurationForm";
import { SUPPLIER_PAX_VALIDATION_MESSAGES } from "../model/validation";

describe("useAddPaxConfigurationForm", () => {
  it("validates with the Zod submit schema before calling onSubmit", async () => {
    const onSubmit = vi.fn();
    const onValidationError = vi.fn();
    const { result } = renderHook(() =>
      useAddPaxConfigurationForm({
        messages: SUPPLIER_PAX_VALIDATION_MESSAGES,
        onSubmit,
        onValidationError,
      })
    );

    act(() => {
      result.current.form.setFieldValue("validFrom", "2026-01-01");
      result.current.form.setFieldValue("paxTypes", [
        {
          name: "Adult",
          paxType: "Adult",
          ageFrom: "20",
          ageTo: "60",
          isActive: true,
        },
        {
          name: "Child",
          paxType: "Child",
          ageFrom: "10",
          ageTo: "21",
          isActive: true,
        },
        {
          name: "Infant",
          paxType: "Infant",
          ageFrom: "",
          ageTo: "",
          isActive: false,
        },
        {
          name: "Teen",
          paxType: "Teen",
          ageFrom: "",
          ageTo: "",
          isActive: false,
        },
      ]);
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledWith(
      expect.objectContaining({
        isValid: false,
        form: expect.arrayContaining([
          "Age ranges must not overlap across active Pax Types.",
        ]),
      })
    );
  });
});
