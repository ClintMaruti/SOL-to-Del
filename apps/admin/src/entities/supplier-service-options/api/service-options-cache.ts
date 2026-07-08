import type { ServiceOption } from "../model/types";

type ServiceOptionSummary = {
  id: string;
  name: string;
  isActive: boolean;
  rates?: unknown[];
  ratePlans?: unknown[];
};

type SupplierServiceCache = {
  id: string;
  options?: ServiceOptionSummary[];
};

export function prependServiceOption(
  previous: ServiceOption[] | undefined,
  created: ServiceOption
) {
  const list = previous ?? [];
  return [created, ...list.filter((option) => option.id !== created.id)];
}

export function replaceServiceOption(
  previous: ServiceOption[] | undefined,
  updated: ServiceOption
) {
  if (!previous?.length) {
    return [updated];
  }

  const index = previous.findIndex((option) => option.id === updated.id);

  if (index === -1) {
    return previous;
  }

  const next = [...previous];
  next[index] = updated;
  return next;
}

export function serviceOptionToSummary(
  option: ServiceOption
): ServiceOptionSummary {
  return {
    id: option.id,
    name: option.title,
    isActive: option.isActive,
    rates: [],
    ratePlans: [],
  };
}

export function prependOptionSummary<T extends SupplierServiceCache>(
  service: T,
  created: ServiceOption
): T {
  if (!Array.isArray(service.options)) {
    return service;
  }

  const summary = serviceOptionToSummary(created);

  return {
    ...service,
    options: [
      summary,
      ...service.options.filter((option) => option.id !== created.id),
    ],
  };
}

export function replaceOptionSummary<T extends SupplierServiceCache>(
  service: T,
  updated: ServiceOption
): T {
  if (!Array.isArray(service.options)) {
    return service;
  }

  return {
    ...service,
    options: service.options.map((option) =>
      option.id === updated.id
        ? {
            ...option,
            name: updated.title,
            isActive: updated.isActive,
          }
        : option
    ),
  };
}
