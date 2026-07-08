import type { PromotionDetailPaxType, PromotionPaxCode } from "./types";

const DETAIL_PAX_TYPE_TO_FORM_CODE = {
  Any: "ANY",
  Adult: "ADT",
  Child: "CHD",
  Infant: "INF",
  Youth: "YTH",
  ADT: "ADT",
  CHD: "CHD",
  INF: "INF",
  YTH: "YTH",
  Teen: "YTH",
} as const satisfies Record<string, PromotionPaxCode>;

const FORM_CODE_TO_DETAIL_PAX_TYPE: Record<
  PromotionPaxCode,
  PromotionDetailPaxType | null
> = {
  ANY: null,
  ADT: "Adult",
  CHD: "Child",
  INF: "Infant",
  YTH: "Teen",
};

export function toPromotionFormPaxCode(
  paxType:
    | PromotionDetailPaxType
    | PromotionPaxCode
    | "Youth"
    | null
    | undefined
): PromotionPaxCode {
  if (
    paxType === "ANY" ||
    paxType === "ADT" ||
    paxType === "CHD" ||
    paxType === "INF" ||
    paxType === "YTH"
  ) {
    return paxType;
  }

  return DETAIL_PAX_TYPE_TO_FORM_CODE[paxType ?? "Any"] ?? "ANY";
}

export function toPromotionDetailPaxType(
  paxCode: PromotionPaxCode | null | undefined
): PromotionDetailPaxType | null {
  if (!paxCode) {
    return null;
  }

  return FORM_CODE_TO_DETAIL_PAX_TYPE[paxCode] ?? null;
}
