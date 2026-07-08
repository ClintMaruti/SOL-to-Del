import type {
  CatalogContractedExtraDetail,
  CatalogContractedExtraTravelDateDto,
  CatalogMoneyAmountDto,
  CatalogPaxType,
} from "../model/types";

import {
  nullableStr,
  num,
  str,
  toApiRow,
  type ApiRow,
} from "./normalize-api-row";

function normalizeMoney(raw: unknown): CatalogMoneyAmountDto | null {
  if (raw === null || raw === undefined) return null;
  const row = toApiRow(raw);
  const amount = row.amount ?? row.Amount;
  const currency = row.currency ?? row.Currency;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  return {
    amount,
    currency: typeof currency === "string" ? currency : "USD",
  };
}

function normalizePaxType(raw: unknown): CatalogPaxType | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw as CatalogPaxType;
}

function travelDatesFromFlat(
  row: ApiRow
): CatalogContractedExtraTravelDateDto[] {
  const travelFrom = nullableStr(row, "travelFrom", "TravelFrom");
  const travelTo = nullableStr(row, "travelTo", "TravelTo");
  if (!travelFrom?.trim() || !travelTo?.trim()) {
    return [];
  }

  return [
    {
      id: str(row, "id", "Id") || "travel-1",
      paxType: normalizePaxType(row.paxType ?? row.PaxType),
      travelFrom,
      travelTo,
      net: normalizeMoney(row.net ?? row.Net),
      rack: normalizeMoney(row.rack ?? row.Rack),
      sell: normalizeMoney(row.sell ?? row.Sell),
    },
  ];
}

function normalizeTravelDatesArray(
  raw: unknown
): CatalogContractedExtraTravelDateDto[] {
  if (!Array.isArray(raw)) return [];
  const out: CatalogContractedExtraTravelDateDto[] = [];
  for (const item of raw) {
    const row = toApiRow(item);
    const travelFrom = nullableStr(row, "travelFrom", "TravelFrom");
    const travelTo = nullableStr(row, "travelTo", "TravelTo");
    if (!travelFrom?.trim() || !travelTo?.trim()) continue;
    out.push({
      id: str(row, "id", "Id") || `td-${out.length + 1}`,
      paxType: normalizePaxType(row.paxType ?? row.PaxType),
      travelFrom,
      travelTo,
      net: normalizeMoney(row.net ?? row.Net),
      rack: normalizeMoney(row.rack ?? row.Rack),
      sell: normalizeMoney(row.sell ?? row.Sell),
    });
  }
  return out;
}

/** Normalizes GET `/contracted-extras` and embedded contracted payloads. */
export function normalizeContractedExtra(
  raw: unknown
): CatalogContractedExtraDetail | null {
  if (raw === null || raw === undefined) return null;
  const row = toApiRow(raw);
  const id = str(row, "id", "Id");
  if (!id.trim()) return null;

  const travelDates = normalizeTravelDatesArray(
    row.travelDates ?? row.TravelDates
  );
  const flatTravelDates = travelDatesFromFlat(row);

  const extraTypeRaw = str(row, "extraType", "ExtraType");
  const chargeTypeRaw = str(row, "chargeType", "ChargeType");
  const timeUnitRaw = str(row, "timeUnit", "TimeUnit");

  const travelFrom =
    nullableStr(row, "travelFrom", "TravelFrom") ??
    flatTravelDates[0]?.travelFrom ??
    null;
  const travelTo =
    nullableStr(row, "travelTo", "TravelTo") ??
    flatTravelDates[0]?.travelTo ??
    null;

  return {
    id,
    contractId: str(row, "contractId", "ContractId"),
    validFrom: nullableStr(row, "validFrom", "ValidFrom"),
    validTo: nullableStr(row, "validTo", "ValidTo"),
    extraType: extraTypeRaw === "Mandatory" ? "Mandatory" : "Optional",
    chargeType: chargeTypeRaw === "Unit" ? "Unit" : "Person",
    timeUnit:
      timeUnitRaw === "Day"
        ? "Day"
        : timeUnitRaw === "Stay"
          ? "Stay"
          : timeUnitRaw === "None"
            ? "None"
            : "Night",
    travelFrom,
    travelTo,
    paxType: normalizePaxType(row.paxType ?? row.PaxType),
    net: normalizeMoney(row.net ?? row.Net),
    rack: normalizeMoney(row.rack ?? row.Rack),
    sell: normalizeMoney(row.sell ?? row.Sell),
    version: num(row, "version", "Version"),
    travelDates:
      travelDates.length > 0
        ? travelDates
        : flatTravelDates.length > 0
          ? flatTravelDates
          : undefined,
  };
}
