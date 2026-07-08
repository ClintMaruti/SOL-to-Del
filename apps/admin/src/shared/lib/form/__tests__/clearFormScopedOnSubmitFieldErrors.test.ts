import { describe, expect, it } from "vitest";

import {
  clearFormScopedOnSubmitFieldErrors,
  clearFormScopedOnSubmitFieldErrorsByPrefix,
} from "../clearFormScopedOnSubmitFieldErrors";

type FieldMeta = {
  errorMap?: Record<string, unknown>;
  errorSourceMap?: Record<string, string | undefined>;
};

function createFormApi(fieldMetaBase: Record<string, FieldMeta | undefined>) {
  const form = {
    baseStore: {
      state: {
        fieldMetaBase,
      },
    },
    setFieldMeta(field: string, updater: (prev: unknown) => unknown) {
      form.baseStore.state.fieldMetaBase[field] = updater(
        form.baseStore.state.fieldMetaBase[field]
      ) as FieldMeta;
    },
  };

  return form;
}

describe("clearFormScopedOnSubmitFieldErrors", () => {
  it("clears all form-scoped submit errors", () => {
    const form = createFormApi({
      "travelDates[0].from": {
        errorMap: { onSubmit: "Travel Dates From is required", onBlur: "noop" },
        errorSourceMap: { onSubmit: "form", onBlur: "field" },
      },
      "bookingWindow.from": {
        errorMap: { onSubmit: "Booking Window From is required" },
        errorSourceMap: { onSubmit: "form" },
      },
    });

    clearFormScopedOnSubmitFieldErrors(form);

    expect(form.baseStore.state.fieldMetaBase["travelDates[0].from"]).toEqual({
      errorMap: { onBlur: "noop" },
      errorSourceMap: { onBlur: "field" },
    });
    expect(form.baseStore.state.fieldMetaBase["bookingWindow.from"]).toEqual({
      errorMap: {},
      errorSourceMap: {},
    });
  });

  it("clears only the requested field paths when fieldNames are provided", () => {
    const form = createFormApi({
      validityDateFrom: {
        errorMap: { onSubmit: "Field is required" },
        errorSourceMap: { onSubmit: "form" },
      },
      validityDateTo: {
        errorMap: { onSubmit: "Field is required" },
        errorSourceMap: { onSubmit: "form" },
      },
      name: {
        errorMap: { onSubmit: "Name is required" },
        errorSourceMap: { onSubmit: "form" },
      },
    });

    clearFormScopedOnSubmitFieldErrors(form, ["validityDateFrom"]);

    expect(form.baseStore.state.fieldMetaBase.validityDateFrom).toEqual({
      errorMap: {},
      errorSourceMap: {},
    });
    expect(form.baseStore.state.fieldMetaBase.validityDateTo).toEqual({
      errorMap: { onSubmit: "Field is required" },
      errorSourceMap: { onSubmit: "form" },
    });
    expect(form.baseStore.state.fieldMetaBase.name).toEqual({
      errorMap: { onSubmit: "Name is required" },
      errorSourceMap: { onSubmit: "form" },
    });
  });
});

describe("clearFormScopedOnSubmitFieldErrorsByPrefix", () => {
  it("clears only matching form-scoped submit errors", () => {
    const form = createFormApi({
      "travelDates[0].from": {
        errorMap: { onSubmit: "Travel Dates From is required" },
        errorSourceMap: { onSubmit: "form" },
      },
      "travelDates[0].to": {
        errorMap: { onSubmit: "Travel Dates To is required" },
        errorSourceMap: { onSubmit: "form" },
      },
      "bookingWindow.from": {
        errorMap: { onSubmit: "Booking Window From is required" },
        errorSourceMap: { onSubmit: "form" },
      },
      note: {
        errorMap: { onSubmit: "Note is required", onBlur: "noop" },
        errorSourceMap: { onSubmit: "field", onBlur: "field" },
      },
    });

    clearFormScopedOnSubmitFieldErrorsByPrefix(form, "travelDates");

    expect(form.baseStore.state.fieldMetaBase["travelDates[0].from"]).toEqual({
      errorMap: {},
      errorSourceMap: {},
    });
    expect(form.baseStore.state.fieldMetaBase["travelDates[0].to"]).toEqual({
      errorMap: {},
      errorSourceMap: {},
    });
    expect(form.baseStore.state.fieldMetaBase["bookingWindow.from"]).toEqual({
      errorMap: { onSubmit: "Booking Window From is required" },
      errorSourceMap: { onSubmit: "form" },
    });
    expect(form.baseStore.state.fieldMetaBase.note).toEqual({
      errorMap: { onSubmit: "Note is required", onBlur: "noop" },
      errorSourceMap: { onSubmit: "field", onBlur: "field" },
    });
  });
});
