import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import type { CreateSupplierHeadOfficeFormData } from "@/features/create-supplier-head-office/model/types";
import { resolveToIsoOfficialCountryName } from "@/shared/lib/countries";

/**
 * Map SupplierHeadOffice (API/detail) to form data for the head office form.
 */
export function headOfficeDetailToFormData(
  detail: SupplierHeadOffice
): CreateSupplierHeadOfficeFormData {
  return {
    name: detail.name ?? "",
    email: detail.email ?? "",
    phoneNumber: detail.phoneNumber ?? "",
    additionalEmail: detail.additionalEmail ?? "",
    website: detail.website ?? "",
    country: detail.country
      ? (resolveToIsoOfficialCountryName(detail.country) ?? detail.country)
      : "",
    city: detail.city ?? "",
    postalCode: detail.postalCode ?? "",
    streetAddress: detail.streetAddress ?? "",
  };
}
