export type PaxType = "Adult" | "Child" | "Infant" | "Teen";
export type PaxTypeShortName = "ADT" | "CHD" | "INF" | "YTH";

export const PAX_TYPE_ORDER: PaxType[] = ["Adult", "Child", "Infant", "Teen"];

export const PAX_TYPE_SHORT_NAME: Record<PaxType, PaxTypeShortName> = {
  Adult: "ADT",
  Child: "CHD",
  Infant: "INF",
  Teen: "YTH",
};

export const SHORT_NAME_TO_PAX_TYPE: Record<string, PaxType> = {
  ADT: "Adult",
  CHD: "Child",
  INF: "Infant",
  YTH: "Teen",
};

export interface SupplierPaxTypeDto {
  id?: string;
  name?: PaxType | string | null;
  paxType?: PaxType | PaxTypeShortName | string | null;
  ageFrom?: number | null;
  ageTo?: number | null;
  isActive?: boolean;
  version?: number;
  isAdult?: boolean;
  isInfant?: boolean;
  canDeactivate?: boolean;
  hasActiveDownstreamReferences?: boolean;
}

export interface SupplierPaxType {
  id: string;
  name: PaxType;
  paxType: PaxType;
  code: PaxTypeShortName;
  ageFrom: number | null;
  ageTo: number | null;
  isActive: boolean;
  version?: number;
  isAdult: boolean;
  isInfant: boolean;
  canDeactivate: boolean;
  hasActiveDownstreamReferences: boolean;
}

export interface SupplierPaxTypeScheduleDto {
  id: string;
  supplierId: string;
  validFrom: string;
  validTo?: string | null;
  paxTypes?: SupplierPaxTypeDto[] | null;
  version?: number;
}

export interface SupplierPaxTypeSchedule {
  id: string;
  supplierId: string;
  validFrom: string;
  validTo: string | null;
  paxTypes: SupplierPaxType[];
  version?: number;
}

export interface SupplierPaxTypePayload {
  id?: string;
  name: PaxType;
  paxType: PaxType;
  ageFrom: number | null;
  ageTo: number | null;
  isActive: boolean;
  version?: number;
}

export interface CreateSupplierPaxTypeSchedulePayload {
  supplierId: string;
  validFrom: string;
  validTo: string | null;
  paxTypes: SupplierPaxTypePayload[];
}

export interface UpdateSupplierPaxTypeSchedulePayload {
  id: string;
  supplierId: string;
  validFrom: string;
  validTo: string | null;
  paxTypes: SupplierPaxTypePayload[];
  version?: number;
}

function isPaxType(value: unknown): value is PaxType {
  return (
    value === "Adult" ||
    value === "Child" ||
    value === "Infant" ||
    value === "Teen"
  );
}

function isPaxTypeShortName(value: unknown): value is PaxTypeShortName {
  return (
    value === "ADT" || value === "CHD" || value === "INF" || value === "YTH"
  );
}

export function normalizePaxType(value: unknown, fallback: PaxType): PaxType {
  if (isPaxType(value)) return value;
  if (isPaxTypeShortName(value)) return SHORT_NAME_TO_PAX_TYPE[value];
  return fallback;
}

export function sortSupplierPaxTypes(
  paxTypes: SupplierPaxType[]
): SupplierPaxType[] {
  return [...paxTypes].sort(
    (a, b) =>
      PAX_TYPE_ORDER.indexOf(a.paxType) - PAX_TYPE_ORDER.indexOf(b.paxType)
  );
}

export function sortSupplierPaxTypeSchedules(
  schedules: SupplierPaxTypeSchedule[]
): SupplierPaxTypeSchedule[] {
  return [...schedules].sort((a, b) => b.validFrom.localeCompare(a.validFrom));
}

export function normalizeSupplierPaxType(
  dto: SupplierPaxTypeDto,
  index = 0
): SupplierPaxType {
  const fallback = PAX_TYPE_ORDER[index] ?? "Adult";
  const paxType = normalizePaxType(dto.paxType ?? dto.name, fallback);
  const isAdult = paxType === "Adult";
  const isInfant = paxType === "Infant";
  const hasActiveDownstreamReferences = Boolean(
    dto.hasActiveDownstreamReferences
  );

  return {
    id: dto.id ?? `pax-${PAX_TYPE_SHORT_NAME[paxType].toLowerCase()}`,
    name: normalizePaxType(dto.name ?? paxType, paxType),
    paxType,
    code: PAX_TYPE_SHORT_NAME[paxType],
    ageFrom: dto.ageFrom ?? null,
    ageTo: dto.ageTo ?? null,
    isActive: isAdult ? true : Boolean(dto.isActive),
    version: dto.version,
    isAdult: dto.isAdult ?? isAdult,
    isInfant: dto.isInfant ?? isInfant,
    canDeactivate:
      dto.canDeactivate ?? (!isAdult && !hasActiveDownstreamReferences),
    hasActiveDownstreamReferences,
  };
}

export function normalizeSupplierPaxTypeSchedule(
  dto: SupplierPaxTypeScheduleDto
): SupplierPaxTypeSchedule {
  return {
    id: dto.id,
    supplierId: dto.supplierId,
    validFrom: dto.validFrom,
    validTo: dto.validTo ?? null,
    paxTypes: sortSupplierPaxTypes(
      Array.isArray(dto.paxTypes)
        ? dto.paxTypes.map(normalizeSupplierPaxType)
        : []
    ),
    version: dto.version,
  };
}

export function findSupplierPaxTypeScheduleForDate(
  schedules: SupplierPaxTypeSchedule[],
  date: string | null | undefined
): SupplierPaxTypeSchedule | undefined {
  if (!date) {
    return (
      schedules.find((schedule) => schedule.validTo === null) ?? schedules[0]
    );
  }

  return schedules.find((schedule) => {
    const startsBeforeOrOn = schedule.validFrom <= date;
    const endsAfterOrOn = !schedule.validTo || schedule.validTo >= date;
    return startsBeforeOrOn && endsAfterOrOn;
  });
}

export function getActiveSupplierPaxTypesForDate(
  schedules: SupplierPaxTypeSchedule[],
  date: string | null | undefined
): SupplierPaxType[] {
  const schedule = findSupplierPaxTypeScheduleForDate(schedules, date);
  return schedule?.paxTypes.filter((paxType) => paxType.isActive) ?? [];
}
