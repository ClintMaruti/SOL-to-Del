import type { ServiceType } from "@/entities/service-type";
import type { ServiceOption } from "@/entities/supplier-service-options";
import type {
  SupplierService,
  SupplierServiceOption,
} from "@/entities/supplier-services";

function normalizeComparableLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function getSupplierServiceLabel(
  service: Pick<
    SupplierService,
    "id" | "name" | "serviceName" | "alternativeName"
  >
) {
  return (
    service.serviceName?.trim() ||
    service.name?.trim() ||
    service.alternativeName?.trim() ||
    service.id
  );
}

export function getServiceOptionLabel(
  option: Pick<ServiceOption, "id"> & {
    title?: string | null;
    name?: string | null;
  }
) {
  return option.title?.trim() || option.name?.trim() || option.id;
}

type CatalogServiceOptionLike = Pick<ServiceOption, "id"> & {
  title?: string | null;
  name?: string | null;
  isActive?: boolean | null;
};

export function mergeServiceOptionSources(
  fetchedOptions: CatalogServiceOptionLike[],
  embeddedOptions: SupplierServiceOption[]
) {
  const mergedById = new Map<string, CatalogServiceOptionLike>();

  for (const option of embeddedOptions) {
    mergedById.set(option.id, option);
  }

  for (const option of fetchedOptions) {
    const existing = mergedById.get(option.id);

    mergedById.set(option.id, {
      ...existing,
      ...option,
      title: option.title ?? existing?.title,
      name: option.name ?? existing?.name,
      isActive: option.isActive ?? existing?.isActive,
    });
  }

  return Array.from(mergedById.values());
}

export function matchesSelectedServiceType(
  service: Pick<SupplierService, "type">,
  selectedServiceTypeId: string | null | undefined,
  serviceTypes: ServiceType[]
) {
  if (!selectedServiceTypeId) {
    return true;
  }

  const selectedServiceType = serviceTypes.find(
    (serviceType) => serviceType.id === selectedServiceTypeId
  );
  const selectedServiceTypeName = normalizeComparableLabel(
    selectedServiceType?.name
  );

  if (!selectedServiceTypeName) {
    return true;
  }

  return normalizeComparableLabel(service.type) === selectedServiceTypeName;
}
