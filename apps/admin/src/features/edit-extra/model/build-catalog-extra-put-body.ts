import type {
  CatalogExtraDetail,
  CatalogExtraPutBody,
  CatalogNoteDto,
} from "@/entities/catalog-extra";
import {
  isContractedExtraConfigured,
  type EditExtraSubmitValues,
} from "./schema";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function toDateOnly(iso: string | null | undefined): string | null {
  if (iso == null || typeof iso !== "string") return null;
  const t = iso.trim();
  if (!t) return null;
  return t.length >= 10 ? t.slice(0, 10) : t;
}

function parseMoneyField(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function mapNotesToPut(
  notes: EditExtraSubmitValues["notes"]
): CatalogNoteDto | null {
  const text = notes.text.trim();
  if (!text && !notes.id) {
    return null;
  }
  if (!notes.id) {
    return { id: NIL_UUID, text, version: notes.version };
  }
  return { id: notes.id, text, version: notes.version };
}

function uiExtraType(
  v: EditExtraSubmitValues["contracted"]["extraRequirement"]
): "Mandatory" | "Optional" {
  return v === "mandatory" ? "Mandatory" : "Optional";
}

function uiChargeType(
  v: EditExtraSubmitValues["contracted"]["chargeType"]
): "Person" | "Unit" {
  return v === "person" ? "Person" : "Unit";
}

function uiTimeUnit(
  v: EditExtraSubmitValues["contracted"]["timeUnit"]
): "Night" | "Day" | "Stay" {
  switch (v) {
    case "night":
      return "Night";
    case "day":
      return "Day";
    case "stay":
      return "Stay";
    default:
      return "Night";
  }
}

export function buildCatalogExtraPutBody(args: {
  extra: CatalogExtraDetail;
  values: EditExtraSubmitValues;
}): CatalogExtraPutBody {
  const { extra, values } = args;
  const title = values.title.trim();
  const descriptionRaw = values.description.trim();
  const shouldSendContractedExtra = isContractedExtraConfigured(
    values.contracted
  );

  let contractedExtra: CatalogExtraPutBody["contractedExtra"] = null;
  if (shouldSendContractedExtra) {
    const travelRow =
      values.contracted.travelDates.find(
        (row) => row.travelFrom?.trim() && row.travelTo?.trim()
      ) ?? values.contracted.travelDates[0];

    const travelFrom = travelRow?.travelFrom?.trim() ?? "";
    const travelTo = travelRow?.travelTo?.trim() ?? "";

    contractedExtra = {
      contractId: values.contracted.contractId,
      extraType: uiExtraType(values.contracted.extraRequirement),
      chargeType: uiChargeType(values.contracted.chargeType),
      timeUnit: uiTimeUnit(values.contracted.timeUnit),
      travelFrom: travelFrom ? (toDateOnly(travelFrom) ?? travelFrom) : null,
      travelTo: travelTo ? (toDateOnly(travelTo) ?? travelTo) : null,
      net: travelRow ? parseMoneyField(travelRow.net) : null,
      rack: travelRow ? parseMoneyField(travelRow.rack) : null,
      sell: travelRow ? parseMoneyField(travelRow.sell) : null,
    };

    if (contractedExtra && values.contracted.contractedExtraId) {
      contractedExtra.id = values.contracted.contractedExtraId;
      if (values.contracted.contractedExtraVersion != null) {
        contractedExtra.version = values.contracted.contractedExtraVersion;
      }
    }
  }

  return {
    id: extra.id,
    title,
    description: descriptionRaw.length === 0 ? null : descriptionRaw,
    isActive: extra.isActive,
    version: extra.version ?? 0,
    serviceIds: values.serviceIds?.map((x) => x.trim()).filter(Boolean),
    notes: mapNotesToPut(values.notes),
    contractedExtra,
  };
}
