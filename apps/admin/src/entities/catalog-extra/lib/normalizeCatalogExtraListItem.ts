import type {
  CatalogExtra,
  CatalogExtraLinkedServiceOption,
} from "../model/types";

import {
  bool,
  nullableStr,
  num,
  str,
  toApiRow,
  type ApiRow,
} from "./normalize-api-row";

function normalizeLinkedServicesOptions(
  raw: unknown
): CatalogExtraLinkedServiceOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: CatalogExtraLinkedServiceOption[] = [];
  for (const item of raw) {
    const r = toApiRow(item);
    const serviceId = r.serviceId ?? r.ServiceId;
    const serviceName = r.serviceName ?? r.ServiceName;
    const serviceOptionId = r.serviceOptionId ?? r.ServiceOptionId;
    const serviceOptionName =
      r.serviceOptionName ??
      r.ServiceOptionName ??
      r.serviceOptionTitle ??
      r.ServiceOptionTitle;
    out.push({
      serviceId:
        typeof serviceId === "string"
          ? serviceId
          : serviceId === null
            ? null
            : null,
      serviceName:
        typeof serviceName === "string"
          ? serviceName
          : serviceName === null
            ? null
            : null,
      serviceOptionId:
        typeof serviceOptionId === "string"
          ? serviceOptionId
          : serviceOptionId === null
            ? null
            : null,
      serviceOptionName:
        typeof serviceOptionName === "string"
          ? serviceOptionName
          : serviceOptionName === null
            ? null
            : null,
    });
  }
  return out.length > 0 ? out : undefined;
}

/** BE list shape: `linkedServices: ServiceSummaryDto[]` (id + name). */
function normalizeLinkedServicesSummary(
  raw: unknown
): CatalogExtraLinkedServiceOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: CatalogExtraLinkedServiceOption[] = [];
  for (const item of raw) {
    const r = toApiRow(item);
    const id = r.id ?? r.Id;
    const name = r.name ?? r.Name;
    if (typeof id !== "string" || !id.trim()) continue;
    out.push({
      serviceId: id,
      serviceName: typeof name === "string" ? name : null,
      serviceOptionId: null,
      serviceOptionName: null,
    });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * GET `/catalog/suppliers/:id/extras` and `/catalog/services/:id/extras` may return
 * camelCase or PascalCase; supplier lists use `linkedServices`, legacy mocks use
 * `linkedServicesOptions`.
 */
export function normalizeCatalogExtraListItem(raw: unknown): CatalogExtra {
  const row = toApiRow(raw);

  let serviceName = str(row, "serviceName", "ServiceName");
  if (!serviceName.trim()) {
    const svc = row.service ?? row.Service;
    if (typeof svc === "object" && svc !== null) {
      const o = svc as ApiRow;
      const n = o.name ?? o.Name;
      if (typeof n === "string") serviceName = n;
    }
  }

  const linkedServicesOptions =
    normalizeLinkedServicesOptions(
      row.linkedServicesOptions ?? row.LinkedServicesOptions
    ) ??
    normalizeLinkedServicesSummary(row.linkedServices ?? row.LinkedServices);

  const firstLinked = linkedServicesOptions?.[0];

  return {
    id: str(row, "id", "Id"),
    title: str(row, "title", "Title"),
    serviceId:
      str(row, "serviceId", "ServiceId") ||
      (typeof firstLinked?.serviceId === "string"
        ? firstLinked.serviceId
        : undefined),
    serviceName: serviceName || firstLinked?.serviceName || undefined,
    linkedServicesOptions,
    description: nullableStr(row, "description", "Description"),
    isActive: bool(row, "isActive", "IsActive"),
    extraType:
      str(row, "extraType", "ExtraType") === "Mandatory"
        ? "Mandatory"
        : "Optional",
    chargeType:
      str(row, "chargeType", "ChargeType") === "Unit" ? "Unit" : "Person",
    pricing: (() => {
      const pricingRow = toApiRow(row.pricing ?? row.Pricing);
      return {
        net: num(pricingRow, "net", "Net"),
        sell: num(pricingRow, "sell", "Sell"),
        rack: num(pricingRow, "rack", "Rack"),
      };
    })(),
  };
}
