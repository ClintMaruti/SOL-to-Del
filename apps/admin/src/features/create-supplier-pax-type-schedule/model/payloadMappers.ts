import type {
  CreateSupplierPaxTypeSchedulePayload,
  SupplierPaxTypePayload,
  SupplierPaxTypeSchedule,
  UpdateSupplierPaxTypeSchedulePayload,
} from "@/entities/supplier-pax-type-schedule";

import type {
  AddPaxConfigurationFormValues,
  SupplierPaxTypeFormRow,
} from "./types";

function toNullableInteger(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function mapSupplierPaxTypeFormRowToPayload(
  row: SupplierPaxTypeFormRow
): SupplierPaxTypePayload {
  return {
    name: row.name,
    paxType: row.paxType,
    ageFrom: toNullableInteger(row.ageFrom),
    ageTo: toNullableInteger(row.ageTo),
    isActive: row.paxType === "Adult" ? true : row.isActive,
  };
}

export function mapCreateSupplierPaxTypeSchedulePayload(
  supplierId: string,
  values: AddPaxConfigurationFormValues
): CreateSupplierPaxTypeSchedulePayload {
  return {
    supplierId,
    validFrom: values.validFrom,
    validTo: values.validTo || null,
    paxTypes: values.paxTypes.map(mapSupplierPaxTypeFormRowToPayload),
  };
}

export function mapUpdateSupplierPaxTypeSchedulePayload(
  schedule: SupplierPaxTypeSchedule,
  validTo: string | null
): UpdateSupplierPaxTypeSchedulePayload {
  return {
    id: schedule.id,
    supplierId: schedule.supplierId,
    validFrom: schedule.validFrom,
    validTo,
    version: schedule.version,
    paxTypes: schedule.paxTypes.map((row) => ({
      id: row.id,
      name: row.name,
      paxType: row.paxType,
      ageFrom: row.ageFrom,
      ageTo: row.ageTo,
      isActive: row.isActive,
      version: row.version,
    })),
  };
}
