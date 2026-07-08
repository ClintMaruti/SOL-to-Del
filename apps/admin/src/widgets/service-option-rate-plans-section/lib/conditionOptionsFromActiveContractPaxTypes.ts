import type { ConditionOption } from "@/entities/service-option-rate-plan";
import {
  PAX_TYPE_ORDER,
  PAX_TYPE_SHORT_NAME,
  type SupplierPaxType,
} from "@/entities/supplier-pax-type-schedule";

/** Maps supplier PAX schedule rows to rule condition option codes in canonical order (only `isActive` rows). */
export function conditionOptionsFromActiveSupplierPaxTypes(
  paxTypes: SupplierPaxType[]
): ConditionOption[] {
  const active = new Set(
    paxTypes.filter((p) => p.isActive).map((p) => p.paxType)
  );
  return PAX_TYPE_ORDER.filter((pt) => active.has(pt)).map(
    (pt) => PAX_TYPE_SHORT_NAME[pt] as ConditionOption
  );
}
