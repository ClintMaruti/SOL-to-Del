import { describe, expect, it } from "vitest";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";

import { headOfficeDetailToFormData } from "../lib/headOfficeDetailToFormData";

describe("headOfficeDetailToFormData", () => {
  it("normalizes catalog country labels to ISO official names", () => {
    const detail = {
      id: "ho-1",
      name: "Test Office",
      email: "test@example.com",
      phoneNumber: "+255712345678",
      additionalEmail: null,
      website: null,
      country: "Tanzania",
      city: null,
      postalCode: null,
      streetAddress: null,
      isActive: true,
      suppliersCount: 0,
    } satisfies SupplierHeadOffice;

    expect(headOfficeDetailToFormData(detail).country).toBe(
      "United Republic of Tanzania"
    );
  });
});
