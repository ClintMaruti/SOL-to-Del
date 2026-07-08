import type {
  ContractedRateAggregateApiDto,
  ContractedRateApiItem,
  ContractedRateDateApiDto,
  ContractedRateFlatApiDto,
  ContractedRateOptionApiDto,
  CreateContractedRatesRequestBody,
} from "./api-types";
import type { ContractedRate } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAggregateDto(
  dto: ContractedRateApiItem
): dto is ContractedRateAggregateApiDto {
  return Array.isArray((dto as ContractedRateAggregateApiDto).options);
}

function isFlatDto(
  dto: ContractedRateApiItem
): dto is ContractedRateFlatApiDto {
  const flat = dto as ContractedRateFlatApiDto;
  return (
    typeof flat.serviceOptionId === "string" &&
    typeof flat.rateId === "string" &&
    !Array.isArray((dto as ContractedRateAggregateApiDto).options)
  );
}

function normalizeDates(
  dates: ContractedRateDateApiDto[] | undefined,
  bookingWindowFrom?: string | null,
  bookingWindowTo?: string | null
): ContractedRateDateApiDto[] {
  if (!Array.isArray(dates)) {
    return [];
  }

  const parentFrom = bookingWindowFrom?.trim() || null;
  const parentTo = bookingWindowTo?.trim() || null;

  return dates.map((d) => ({
    id: d.id,
    travelDateFrom: d.travelDateFrom,
    travelDateTo: d.travelDateTo,
    bookingWindowFrom: d.bookingWindowFrom?.trim() || parentFrom || null,
    bookingWindowTo: d.bookingWindowTo?.trim() || parentTo || null,
    weekdays: Array.isArray(d.weekdays) ? d.weekdays : [],
  }));
}

function flattenAggregate(
  dto: ContractedRateAggregateApiDto
): ContractedRate[] {
  const dates = normalizeDates(
    dto.dates,
    dto.bookingWindowFrom,
    dto.bookingWindowTo
  );
  const parentVersion = dto.version ?? 0;
  const options = Array.isArray(dto.options) ? dto.options : [];

  return options.map((option) =>
    mapOptionToRow(dto, option, dates, parentVersion)
  );
}

function mapOptionToRow(
  parent: ContractedRateAggregateApiDto,
  option: ContractedRateOptionApiDto,
  dates: ContractedRateDateApiDto[],
  parentVersion: number
): ContractedRate {
  return {
    id: option.id,
    contractedRateId: parent.id,
    contractId: parent.contractId,
    serviceOptionId: option.serviceOptionId,
    rateId: option.rateId,
    seasonName: parent.seasonName.trim(),
    priority: parent.priority,
    net: option.net,
    rack: option.rack,
    sell: option.sell,
    version: parentVersion,
    dates,
  };
}

function mapFlatDto(dto: ContractedRateFlatApiDto): ContractedRate {
  const dates = normalizeDates(
    dto.dates,
    dto.bookingWindowFrom,
    dto.bookingWindowTo
  );

  return {
    id: dto.id,
    contractedRateId: dto.id,
    contractId: dto.contractId,
    serviceOptionId: dto.serviceOptionId,
    rateId: dto.rateId,
    seasonName: dto.seasonName.trim(),
    priority: dto.priority,
    net: dto.net,
    rack: dto.rack,
    sell: dto.sell,
    version: dto.version ?? 0,
    dates,
  };
}

export function mapContractedRateApiItemToModel(
  dto: ContractedRateApiItem
): ContractedRate[] {
  if (isAggregateDto(dto)) {
    return flattenAggregate(dto);
  }
  if (isFlatDto(dto)) {
    return [mapFlatDto(dto)];
  }
  return [];
}

export function mapContractedRatesDtoToModel(
  list: ContractedRateApiItem[]
): ContractedRate[] {
  return list.flatMap(mapContractedRateApiItemToModel);
}

/** Unwrap list payloads that may be a raw array, single DTO, or `{ data }` envelope. */
export function normalizeContractedRatesApiList(
  data: unknown
): ContractedRateApiItem[] {
  if (Array.isArray(data)) {
    return data as ContractedRateApiItem[];
  }
  if (!isRecord(data)) {
    return [];
  }
  if (Array.isArray(data.data)) {
    return data.data as ContractedRateApiItem[];
  }
  if (data.data != null && isRecord(data.data)) {
    return [data.data as unknown as ContractedRateApiItem];
  }
  if (typeof data.id === "string") {
    return [data as unknown as ContractedRateApiItem];
  }
  return [];
}

/** Map UI create body to API shape (parent-level booking window + date rows without BW). */
export function mapCreateContractedRatesBodyToApi(
  body: CreateContractedRatesRequestBody
): Record<string, unknown> {
  const primaryBooking =
    body.dates.find((d) => d.bookingWindowFrom || d.bookingWindowTo) ??
    body.dates[0];

  return {
    contractId: body.contractId,
    seasonName: body.seasonName,
    priority: body.priority,
    bookingWindowFrom:
      body.bookingWindowFrom ?? primaryBooking?.bookingWindowFrom ?? null,
    bookingWindowTo:
      body.bookingWindowTo ?? primaryBooking?.bookingWindowTo ?? null,
    dates: body.dates.map((d) => ({
      id: d.id ?? null,
      travelDateFrom: d.travelDateFrom,
      travelDateTo: d.travelDateTo,
      weekdays: d.weekdays ?? [],
    })),
    priceRows: body.priceRows,
  };
}
