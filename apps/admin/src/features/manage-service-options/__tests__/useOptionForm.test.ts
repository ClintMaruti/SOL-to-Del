import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createEmptyOperatingDaySelection } from "../model/operating-days";
import { useOptionForm, type OptionFormValues } from "../model/useOptionForm";

const INITIAL_OPTION: OptionFormValues = {
  title: "Game Drive",
  includes: "",
  excludes: "",
  contractId: "contract-1",
  isActive: false,
  timeFrom: "",
  timeTo: "",
  flightNumber: "",
  operatingDaySelected: createEmptyOperatingDaySelection(),
};

describe("useOptionForm", () => {
  it("does not mark the form dirty when only contractId changes", async () => {
    const { result } = renderHook(() => useOptionForm(INITIAL_OPTION));

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });

    act(() => {
      result.current.form.setFieldValue("contractId", "contract-2");
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });
  });

  it("still marks the form dirty when a persisted field changes", async () => {
    const { result } = renderHook(() => useOptionForm(INITIAL_OPTION));

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });

    act(() => {
      result.current.form.setFieldValue("title", "Sunset Cruise");
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(true);
    });
  });

  it("marks the form dirty when a schedule field changes", async () => {
    const { result } = renderHook(() => useOptionForm(INITIAL_OPTION));

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });

    act(() => {
      result.current.form.setFieldValue("timeFrom", "9:00 AM");
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(true);
    });
  });
});
