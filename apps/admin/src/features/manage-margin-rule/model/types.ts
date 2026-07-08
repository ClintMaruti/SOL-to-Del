import type {
  CreateMarginRulePayload,
  MarginRule,
  MarginRuleModalMode,
  UpdateMarginRulePayload,
} from "@/entities/margin-rule";

export interface MarginRuleFormValues {
  agencyGroupId: string;
  serviceTypeId: string;
  supplierId: string;
  serviceId: string;
  optionId: string;
  validFrom: string;
  validTo: string;
  marginPercent: string;
}

export type MarginRuleFieldName =
  | "agencyGroupId"
  | "serviceTypeId"
  | "supplierId"
  | "serviceId"
  | "optionId"
  | "validFrom"
  | "validTo"
  | "marginPercent";

export type MarginRuleFieldErrors = Partial<
  Record<MarginRuleFieldName, string>
>;

export type MarginRuleSubmitIntent = "save" | "saveAndCreate";

export interface MarginRuleCacheItemShape extends Omit<
  MarginRule,
  "id" | "version"
> {}

export interface CreateMarginRuleVariables {
  payload: CreateMarginRulePayload;
  cacheItem: MarginRuleCacheItemShape;
}

export interface UpdateMarginRuleVariables {
  marginRuleId: string;
  payload: UpdateMarginRulePayload;
  previousRule: MarginRule;
  cacheItem: MarginRuleCacheItemShape;
}

export const ANY_SCOPE_VALUE = "__any__";
export const EMPTY_MARGIN_RULE_FORM_VALUES: MarginRuleFormValues = {
  agencyGroupId: "",
  serviceTypeId: "",
  supplierId: ANY_SCOPE_VALUE,
  serviceId: ANY_SCOPE_VALUE,
  optionId: ANY_SCOPE_VALUE,
  validFrom: "",
  validTo: "",
  marginPercent: "",
};

export const CLEARED_MARGIN_RULE_FORM_VALUES: MarginRuleFormValues = {
  agencyGroupId: "",
  serviceTypeId: "",
  supplierId: "",
  serviceId: "",
  optionId: "",
  validFrom: "",
  validTo: "",
  marginPercent: "",
};

export interface MarginRuleModalState {
  mode: MarginRuleModalMode;
  rule: MarginRule | null;
}
