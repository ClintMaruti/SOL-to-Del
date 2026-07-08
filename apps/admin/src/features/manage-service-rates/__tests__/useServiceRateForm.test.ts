import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceRate } from "@/entities/service-rate";

import { DEFAULT_SERVICE_RATE_FORM } from "../model/schema";
import { useServiceRateForm } from "../model/useServiceRateForm";

const resetCreate = vi.fn();
const resetUpdate = vi.fn();

vi.mock("@/entities/service-rate", () => ({
  useCreateServiceRate: () => ({
    mutateAsync: vi.fn(),
    reset: resetCreate,
    isPending: false,
  }),
  useUpdateServiceRate: () => ({
    mutateAsync: vi.fn(),
    reset: resetUpdate,
    isPending: false,
  }),
}));

const sampleRate: ServiceRate = {
  id: "rate-1",
  serviceId: "svc-1",
  name: "Single",
  chargeType: "Person",
  timeUnit: "Night",
  currency: "USD",
  version: 2,
};

describe("useServiceRateForm", () => {
  beforeEach(() => {
    resetCreate.mockClear();
    resetUpdate.mockClear();
  });

  it("resets form and mutations when dialog closes", () => {
    const { result, rerender } = renderHook(
      ({ open }) =>
        useServiceRateForm({
          open,
          serviceId: "svc-1",
          rate: null,
        }),
      { initialProps: { open: true } }
    );

    act(() => {
      result.current.form.setFieldValue("name", "Draft rate");
      result.current.form.setFieldValue("chargeType", "Unit");
    });

    expect(result.current.form.state.values.name).toBe("Draft rate");

    rerender({ open: false });

    expect(result.current.form.state.values).toEqual(DEFAULT_SERVICE_RATE_FORM);
    expect(resetCreate).toHaveBeenCalled();
    expect(resetUpdate).toHaveBeenCalled();
  });

  it("loads rate values when dialog opens for edit", () => {
    const { result, rerender } = renderHook(
      ({ open, rate }) =>
        useServiceRateForm({
          open,
          serviceId: "svc-1",
          rate,
        }),
      { initialProps: { open: false, rate: null as ServiceRate | null } }
    );

    rerender({ open: true, rate: sampleRate });

    expect(result.current.form.state.values).toEqual({
      name: "Single",
      chargeType: "Person",
      timeUnit: "Night",
    });
  });

  it("does not reset form while dialog stays open", () => {
    const { result, rerender } = renderHook(
      ({ open }) =>
        useServiceRateForm({
          open,
          serviceId: "svc-1",
          rate: null,
        }),
      { initialProps: { open: true } }
    );

    act(() => {
      result.current.form.setFieldValue("name", "In progress");
    });

    rerender({ open: true });

    expect(result.current.form.state.values.name).toBe("In progress");
  });

  it("uses default create values when dialog opens without a rate", () => {
    const { result, rerender } = renderHook(
      ({ open }) =>
        useServiceRateForm({
          open,
          serviceId: "svc-1",
          rate: null,
        }),
      { initialProps: { open: false } }
    );

    rerender({ open: true });

    expect(result.current.form.state.values).toEqual(DEFAULT_SERVICE_RATE_FORM);
  });
});
