import type {
  CatalogExtraDetail,
  CatalogNoteDto,
  CatalogServiceExtra,
} from "../model/types";

import { deriveCatalogExtraServiceIds } from "./derive-catalog-extra-service-ids";
import { normalizeCatalogExtraListItem } from "./normalizeCatalogExtraListItem";
import { normalizeContractedExtra } from "./normalize-contracted-extra";
import { bool, nullableStr, num, str, toApiRow } from "./normalize-api-row";

function normalizeNote(raw: unknown): CatalogNoteDto | null {
  if (raw === null || raw === undefined) return null;
  const row = toApiRow(raw);
  const id = str(row, "id", "Id");
  if (!id.trim()) return null;
  return {
    id,
    text: str(row, "text", "Text"),
    version: num(row, "version", "Version"),
  };
}

function normalizeServiceExtras(
  raw: unknown
): CatalogServiceExtra[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: CatalogServiceExtra[] = [];
  for (const item of raw) {
    const row = toApiRow(item);
    const id = str(row, "id", "Id");
    if (!id.trim()) continue;
    out.push({
      id,
      serviceId: nullableStr(row, "serviceId", "ServiceId"),
      serviceName: nullableStr(row, "serviceName", "ServiceName"),
      serviceOptionId: nullableStr(row, "serviceOptionId", "ServiceOptionId"),
      serviceOptionName:
        nullableStr(row, "serviceOptionName", "ServiceOptionName") ??
        nullableStr(row, "serviceOptionTitle", "ServiceOptionTitle"),
      validFrom: str(row, "validFrom", "ValidFrom"),
      validTo: nullableStr(row, "validTo", "ValidTo"),
      version: num(row, "version", "Version") || undefined,
    });
  }
  return out;
}

/** GET `/catalog/extras/:id` and merged PUT responses. */
export function normalizeCatalogExtraDetail(raw: unknown): CatalogExtraDetail {
  const row = toApiRow(raw);
  const base = normalizeCatalogExtraListItem(raw);
  const serviceExtras = normalizeServiceExtras(
    row.serviceExtras ?? row.ServiceExtras
  );
  const serviceIds = deriveCatalogExtraServiceIds({
    serviceIds: row.serviceIds ?? row.ServiceIds,
    serviceExtras,
    serviceId: base.serviceId,
  });

  const notes =
    normalizeNote(row.notes ?? row.Notes) ??
    normalizeNote(row.note ?? row.Note);

  const contractedRaw = row.contractedExtra ?? row.ContractedExtra ?? undefined;
  const contractedExtra = contractedRaw
    ? normalizeContractedExtra(contractedRaw)
    : undefined;

  const firstLinkedService = serviceExtras?.find((se) => se.serviceId?.trim());

  return {
    ...base,
    serviceId:
      base.serviceId ??
      serviceIds[0] ??
      firstLinkedService?.serviceId ??
      undefined,
    serviceName:
      base.serviceName ?? firstLinkedService?.serviceName ?? undefined,
    supplierId: str(row, "supplierId", "SupplierId") || undefined,
    supplierName: nullableStr(row, "supplierName", "SupplierName") ?? undefined,
    serviceIds,
    serviceExtras,
    notes,
    version: num(row, "version", "Version"),
    contractId:
      contractedExtra?.contractId ??
      nullableStr(row, "contractId", "ContractId") ??
      null,
    contractedExtra: contractedExtra ?? undefined,
  };
}

/** PUT `/catalog/extras/:id` returns `UpdateExtraDto` — merge with prior detail when present. */
export function mergeUpdateExtraIntoDetail(
  updateRaw: unknown,
  previous?: CatalogExtraDetail | null
): CatalogExtraDetail {
  const row = toApiRow(updateRaw);
  const serviceIds = deriveCatalogExtraServiceIds({
    serviceIds: row.serviceIds ?? row.ServiceIds,
    serviceExtras: previous?.serviceExtras,
    serviceId: previous?.serviceId,
  });

  const contractedExtra = normalizeContractedExtra(
    row.contractedExtra ?? row.ContractedExtra
  );

  const notes =
    normalizeNote(row.notes ?? row.Notes) ?? previous?.notes ?? null;

  return {
    id: str(row, "id", "Id") || previous?.id || "",
    title: str(row, "title", "Title") || previous?.title || "",
    description:
      nullableStr(row, "description", "Description") ??
      previous?.description ??
      null,
    isActive:
      row.isActive !== undefined || row.IsActive !== undefined
        ? bool(row, "isActive", "IsActive")
        : (previous?.isActive ?? false),
    serviceId: previous?.serviceId,
    serviceName: previous?.serviceName,
    linkedServicesOptions: previous?.linkedServicesOptions,
    supplierId: str(row, "supplierId", "SupplierId") || previous?.supplierId,
    supplierName: previous?.supplierName,
    serviceIds,
    serviceExtras: previous?.serviceExtras,
    notes,
    version: num(row, "version", "Version") || previous?.version || 0,
    contractId: contractedExtra?.contractId ?? previous?.contractId ?? null,
    contractedExtra: contractedExtra ?? previous?.contractedExtra,
  };
}
