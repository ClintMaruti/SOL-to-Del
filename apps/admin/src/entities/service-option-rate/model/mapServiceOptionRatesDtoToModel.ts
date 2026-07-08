import type {
  ContractedRateApiDto,
  ContractedRateDateWireDto,
  MoneyAmount,
  ServiceOptionRateApiItem,
} from "./api-types";
import { normalizeWeekdaysFromApi } from "./catalogRateEnums";
import type {
  ContractedRate,
  ContractedRateDate,
  ServiceOptionRate,
  TravelDate,
} from "./types";

function mapMoneyAmountFromApi(dto: {
  currency: string;
  value: number;
}): MoneyAmount {
  return {
    currency: dto?.currency?.trim() ?? "",
    value: dto?.value ?? 0,
  };
}

function mapTravelDateApiToDomain(td: {
  id?: string;
  travelDateFrom: string;
  travelDateTo: string;
  weekdays?: string | string[];
}): TravelDate {
  return {
    ...(td.id != null && td.id !== "" ? { id: td.id } : {}),
    travelDateFrom: td.travelDateFrom,
    travelDateTo: td.travelDateTo,
    weekdays: normalizeWeekdaysFromApi(td.weekdays),
  };
}

function mapContractedRateDateDto(
  dto: ContractedRateDateWireDto
): ContractedRateDate {
  return {
    travelDates: [
      mapTravelDateApiToDomain({
        id: dto.id as string,
        travelDateFrom: dto.travelDateFrom,
        travelDateTo: dto.travelDateTo,
        weekdays: dto.weekdays,
      }),
    ],
    version: dto.version,
  };
}

function mapContractedRateDto(
  dto: ContractedRateApiDto,
  parentRateId: string
): ContractedRate {
  return {
    id: dto.id,
    contractId: dto.contractId,
    rateId: dto.rateId ?? parentRateId,
    rack: mapMoneyAmountFromApi(dto.rack),
    net: mapMoneyAmountFromApi(dto.net),
    sell: dto.sell ? mapMoneyAmountFromApi(dto.sell) : null,
    priority: dto.priority,
    bookingWindowFrom: dto.bookingWindowFrom ?? "",
    bookingWindowTo: dto.bookingWindowTo ?? "",
    version: dto.version,
    isActive: dto.isActive,
    contractedRateDates: dto.contractedRateDates.map(mapContractedRateDateDto),
  };
}

export function mapServiceOptionRateApiItemToRate(
  dto: ServiceOptionRateApiItem
): ServiceOptionRate {
  return {
    id: dto.id,
    serviceOptionId: dto.serviceOptionId,
    name: dto.rateName.trim(),
    chargeType: dto.chargeType,
    timeUnit: dto.timeUnit,
    currency: dto?.currency?.trim(),
    ...(dto.version !== undefined ? { version: dto.version } : {}),
    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    contractedRates: dto.contractedRates.map((cr) =>
      mapContractedRateDto(cr, dto.id)
    ),
  };
}

export function mapServiceOptionRatesDtoToModel(
  list: ServiceOptionRateApiItem[]
): ServiceOptionRate[] {
  return list.map(mapServiceOptionRateApiItemToRate);
}
