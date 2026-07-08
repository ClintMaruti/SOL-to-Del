import type { CatalogExtra } from "../model/types";

/**
 * Supplier/service extras list APIs may omit `serviceName` and only send `serviceId`.
 * Resolve the label from a `serviceId → display name` map (e.g. from GET supplier services).
 */
export function resolveCatalogExtraServiceNames(
  extras: CatalogExtra[],
  serviceNameById: ReadonlyMap<string, string>
): CatalogExtra[] {
  return extras.map((e) => ({
    ...e,
    serviceName: e.serviceId
      ? (typeof e.serviceName === "string" && e.serviceName.trim()) ||
        serviceNameById.get(e.serviceId) ||
        ""
      : e.serviceName,
  }));
}
