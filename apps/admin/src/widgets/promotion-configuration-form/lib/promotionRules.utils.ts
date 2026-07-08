import { PROMOTION_SELECT_ANY_VALUE } from "@/entities/promotion";
import type {
  SupplierService,
  SupplierServiceOption,
} from "@/entities/supplier-services";

export function parseNullableInteger(value: string) {
  if (!value.trim()) return null;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

export function getSupplierServiceOptionLabel(option: SupplierServiceOption) {
  const runtimeOption = option as SupplierServiceOption & { title?: string };
  return runtimeOption.name ?? runtimeOption.title ?? "";
}

export function getSupplierServiceLabel(service: SupplierService) {
  return service.name ?? service.serviceName ?? service.alternativeName ?? "";
}

export function getSelectableSupplierServices(services: SupplierService[]) {
  return services.filter((service) => {
    return service.type.trim().toLowerCase() === "accommodation";
  });
}

export function getConditionOptionValues(
  services: SupplierService[],
  selectedServiceId: string | null
) {
  const serviceOptions =
    selectedServiceId && selectedServiceId !== PROMOTION_SELECT_ANY_VALUE
      ? (services.find((service) => service.id === selectedServiceId)
          ?.options ?? [])
      : services.flatMap((service) => service.options);

  const seenOptionValues = new Set<string>();

  return serviceOptions
    .map(getSupplierServiceOptionLabel)
    .filter((optionValue) => {
      if (!optionValue || seenOptionValues.has(optionValue)) {
        return false;
      }

      seenOptionValues.add(optionValue);
      return true;
    });
}
