import type { CatalogServiceExtra } from "../model/types";

/**
 * Supplier-level extras expose linked services via `serviceIds` on PUT responses
 * or concrete `serviceId` values on `serviceExtras` rows from GET detail.
 */
export function deriveCatalogExtraServiceIds(source: {
  serviceIds?: unknown;
  serviceExtras?: CatalogServiceExtra[];
  serviceId?: string;
}): string[] {
  if (Array.isArray(source.serviceIds)) {
    const ids = source.serviceIds
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    if (ids.length > 0) {
      return [...new Set(ids)];
    }
  }

  if (Array.isArray(source.serviceExtras)) {
    const fromRows = source.serviceExtras
      .map((se) => se.serviceId?.trim())
      .filter((x): x is string => Boolean(x));
    if (fromRows.length > 0) {
      return [...new Set(fromRows)];
    }
  }

  const legacy = source.serviceId?.trim();
  return legacy ? [legacy] : [];
}
