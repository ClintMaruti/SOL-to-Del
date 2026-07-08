import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PROMOTION_SELECT_ANY_VALUE } from "../../../entities/promotion/model/types";

import {
  createPromotionDiscountRowFormValue,
  usePromotionForm,
} from "../model/usePromotionForm";

const initialFormValues = {
  version: 3,
  name: "Long Stay Discount",
  isPartiallySupported: false,
  note: "",
  travelDates: [
    {
      id: "travel-1",
      from: "2027-01-01",
      to: "2027-12-31",
    },
  ],
  bookingWindow: {
    from: "2027-01-01",
    to: "2027-12-31",
  },
  bookingWindowRelative: {
    fromDays: null,
    toDays: null,
  },
  conditions: [
    {
      id: "condition-1",
      type: "SupplierNights" as const,
      supplierId: "sup-1",
      serviceId: PROMOTION_SELECT_ANY_VALUE,
      optionText: PROMOTION_SELECT_ANY_VALUE,
      minNights: 5,
      maxNights: null,
    },
  ],
  actions: [],
  isActive: true,
};

describe("usePromotionForm", () => {
  it("uses ANY as the default target nights type for new discount rows", () => {
    expect(createPromotionDiscountRowFormValue().targetNightsType).toBe("ANY");
  });

  it("treats loaded edit data as clean, becomes dirty on change, and resets to new saved values", async () => {
    const { result, rerender } = renderHook(
      ({ formValues }) => usePromotionForm(formValues),
      {
        initialProps: {
          formValues: initialFormValues,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });

    act(() => {
      result.current.form.setFieldValue("name", "Updated Long Stay Discount");
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(true);
    });

    const updatedFormValues = {
      ...initialFormValues,
      version: 4,
      name: "Updated Long Stay Discount",
    };

    rerender({ formValues: updatedFormValues });

    await waitFor(() => {
      expect(result.current.form.state.values.name).toBe(
        "Updated Long Stay Discount"
      );
      expect(result.current.isDirty).toBe(false);
    });
  });
});
