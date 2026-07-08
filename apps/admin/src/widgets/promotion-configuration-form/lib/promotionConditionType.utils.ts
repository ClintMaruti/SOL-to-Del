import type {
  PromotionConditionType,
  PromotionFormCondition,
  PromotionPaxCode,
} from "@/entities/promotion";

function getConditionBounds(condition: PromotionFormCondition) {
  switch (condition.type) {
    case "SupplierNights":
    case "NightsTotal":
      return {
        min: condition.minNights,
        max: condition.maxNights,
      };
    case "SuppliersTotal":
      return {
        min: condition.minSuppliers,
        max: condition.maxSuppliers,
      };
    case "PaxNumber":
      return {
        min: condition.minPax,
        max: condition.maxPax,
      };
    case "PaxAge":
      return {
        min: condition.minAge,
        max: condition.maxAge,
      };
  }
}

function getConditionPaxCode(
  condition: PromotionFormCondition
): PromotionPaxCode {
  if (condition.type === "PaxNumber" || condition.type === "PaxAge") {
    return condition.paxCode;
  }

  return "ANY";
}

export function changePromotionConditionType(
  condition: PromotionFormCondition,
  nextType: PromotionConditionType
): PromotionFormCondition {
  if (condition.type === nextType) {
    return condition;
  }

  const { min, max } = getConditionBounds(condition);
  const base = {
    id: condition.id,
    version: condition.version ?? null,
  };
  const paxCode = getConditionPaxCode(condition);

  switch (nextType) {
    case "SupplierNights":
      return {
        ...base,
        type: "SupplierNights",
        supplierId:
          condition.type === "SupplierNights" ? condition.supplierId : null,
        serviceId:
          condition.type === "SupplierNights" ? condition.serviceId : null,
        optionText:
          condition.type === "SupplierNights" ? condition.optionText : "",
        minNights: min,
        maxNights: max,
      };
    case "SuppliersTotal":
      return {
        ...base,
        type: "SuppliersTotal",
        minSuppliers: min,
        maxSuppliers: max,
      };
    case "NightsTotal":
      return {
        ...base,
        type: "NightsTotal",
        minNights: min,
        maxNights: max,
      };
    case "PaxNumber":
      return {
        ...base,
        type: "PaxNumber",
        paxCode,
        minPax: min,
        maxPax: max,
      };
    case "PaxAge":
      return {
        ...base,
        type: "PaxAge",
        paxCode,
        minAge: min,
        maxAge: max,
      };
  }
}
