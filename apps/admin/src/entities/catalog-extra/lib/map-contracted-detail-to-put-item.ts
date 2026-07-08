import type {
  CatalogContractedExtraDetail,
  CatalogContractedExtraPutItem,
} from "../model/types";

function toDateOnly(iso: string | null | undefined): string | null {
  if (iso == null || typeof iso !== "string") return null;
  const t = iso.trim();
  if (!t) return null;
  return t.length >= 10 ? t.slice(0, 10) : t;
}

/** Maps normalized contracted-extra detail to BE `ContractedExtraItem` (flat travel + money). */
export function mapContractedDetailToPutItem(
  ce: CatalogContractedExtraDetail
): CatalogContractedExtraPutItem {
  const row =
    Array.isArray(ce.travelDates) && ce.travelDates.length > 0
      ? ce.travelDates[0]
      : null;

  const travelFrom =
    toDateOnly(ce.travelFrom) ?? toDateOnly(row?.travelFrom) ?? null;
  const travelTo = toDateOnly(ce.travelTo) ?? toDateOnly(row?.travelTo) ?? null;

  return {
    id: ce.id,
    contractId: ce.contractId,
    extraType: ce.extraType,
    chargeType: ce.chargeType,
    timeUnit: ce.timeUnit === "None" ? "Night" : ce.timeUnit,
    travelFrom,
    travelTo,
    paxType: ce.paxType ?? row?.paxType ?? null,
    net: ce.net?.amount ?? row?.net?.amount ?? null,
    rack: ce.rack?.amount ?? row?.rack?.amount ?? null,
    sell: ce.sell?.amount ?? row?.sell?.amount ?? null,
    version: ce.version,
  };
}
