import type { SupplierService } from "@/entities/supplier-services";

import type { EditSupplierServiceFormValues } from "../model/useEditSupplierServiceForm";

export function supplierServiceDetailToFormData(
  service: SupplierService
): EditSupplierServiceFormValues {
  return {
    name: service.name ?? "",
    alternativeName: service.alternativeName ?? "",
    serviceTypeId: service.serviceTypeId ?? "",
    locationId: service.locationId ?? "",
    fromLocationId: service.fromLocationId ?? "",
    toLocationId: service.toLocationId ?? "",
    description: service.description ?? "",
    tags: service.tags ?? "",
    isActive: service.isActive ?? true,
  };
}
