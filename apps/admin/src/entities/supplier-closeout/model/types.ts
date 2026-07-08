export type SupplierCloseoutStatus = "Active" | "Inactive";

export interface SupplierCloseoutDto {
  id: string;
  supplierId: string;
  serviceId?: string | null;
  serviceName?: string | null;
  serviceOptionId?: string | null;
  serviceOptionName?: string | null;
  travelDateFrom: string;
  travelDateTo: string;
  reason?: string | null;
  status?: SupplierCloseoutStatus | string | null;
  isActive?: boolean;
  version?: number;
}

export interface SupplierCloseout {
  id: string;
  supplierId: string;
  serviceId: string | null;
  serviceName?: string;
  serviceOptionId: string | null;
  serviceOptionName?: string;
  travelDateFrom: string;
  travelDateTo: string;
  reason: string | null;
  status: SupplierCloseoutStatus;
  isActive: boolean;
  version?: number;
}

function normalizeNullableId(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

function normalizeStatus(dto: SupplierCloseoutDto): SupplierCloseoutStatus {
  if (dto.status === "Active" || dto.status === "Inactive") {
    return dto.status;
  }
  return dto.isActive ? "Active" : "Inactive";
}

export function normalizeSupplierCloseout(
  dto: SupplierCloseoutDto
): SupplierCloseout {
  const serviceId = normalizeNullableId(dto.serviceId);
  const serviceOptionId = normalizeNullableId(dto.serviceOptionId);
  const status = normalizeStatus(dto);

  return {
    id: dto.id,
    supplierId: dto.supplierId,
    serviceId,
    serviceName: dto.serviceName ?? undefined,
    serviceOptionId,
    serviceOptionName:
      dto.serviceOptionName ??
      (serviceId && !serviceOptionId ? "ALL" : undefined),
    travelDateFrom: dto.travelDateFrom,
    travelDateTo: dto.travelDateTo,
    reason: dto.reason?.trim() || null,
    status,
    isActive: status === "Active",
    version: dto.version,
  };
}
