import type { ServiceRateApiItem } from "./api-types";
import type { ServiceRate } from "./types";

export function mapServiceRateApiItemToModel(
  dto: ServiceRateApiItem
): ServiceRate {
  return {
    id: dto.id,
    serviceId: dto.serviceId,
    name: dto.rateName.trim(),
    chargeType: dto.chargeType,
    timeUnit: dto.timeUnit,
    currency: dto.currency?.trim() ?? "USD",
    ...(dto.version !== undefined ? { version: dto.version } : {}),
  };
}

export function mapServiceRatesDtoToModel(
  list: ServiceRateApiItem[]
): ServiceRate[] {
  return list.map(mapServiceRateApiItemToModel);
}
