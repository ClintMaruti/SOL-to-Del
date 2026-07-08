import { describe, expect, it } from "vitest";

import type { SupplierDetail } from "@/entities/suppliers";
import { supplierDetailToFormData } from "@/features/edit-supplier/lib/supplierDetailToFormData";

const baseDetail: SupplierDetail = {
  id: "supplier-1",
  name: "Supplier One",
  code: "SUP-001",
  isActive: true,
  headOfficeId: "head-office-1",
  countryId: "kenya",
  city: "Nairobi",
  postalCode: "00100",
  streetAddress: "1 Main Street",
  locationId: null,
  latitude: null,
  longitude: null,
  closestAirstrip: "",
  airstripLatitude: 0,
  airstripLongitude: 0,
};

describe("supplierDetailToFormData", () => {
  it("omits undefined optional payment-term keys", () => {
    const mapped = supplierDetailToFormData({
      ...baseDetail,
      paymentTerms: [
        {
          name: "General",
          travelDatesFrom: null,
          travelDatesTo: null,
        },
      ],
    });

    expect(mapped.paymentTerms[0]).toEqual({
      name: "General",
      travelDatesFrom: "",
      travelDatesTo: "",
      depositPercent: 20,
      balanceDueDays: 60,
    });
    expect("id" in mapped.paymentTerms[0]).toBe(false);
    expect("taxCode" in mapped.paymentTerms[0]).toBe(false);
    expect("isActive" in mapped.paymentTerms[0]).toBe(false);
  });

  it("keeps optional payment-term keys when present", () => {
    const mapped = supplierDetailToFormData({
      ...baseDetail,
      paymentTerms: [
        {
          id: "term-1",
          name: "General",
          travelDatesFrom: "2026-01-01",
          travelDatesTo: "2026-12-31",
          depositPercent: 30,
          balanceDueDays: 45,
          taxCode: "Reduced",
          isActive: true,
        },
      ],
    });

    expect(mapped.paymentTerms[0]).toEqual({
      id: "term-1",
      name: "General",
      travelDatesFrom: "2026-01-01",
      travelDatesTo: "2026-12-31",
      depositPercent: 30,
      balanceDueDays: 45,
      taxCode: "Reduced",
      isActive: true,
    });
  });
});
