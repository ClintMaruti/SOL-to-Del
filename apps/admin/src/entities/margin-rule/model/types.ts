import type { SortDirection } from "@/shared/components/Table/SortIcon";

export const MARGIN_RULES_PAGE_SIZE = 50;

export type MarginRuleSortBy =
  | "agencyGroupName"
  | "serviceType"
  | "supplierName"
  | "serviceName"
  | "optionName"
  | "validFrom"
  | "validTo"
  | "marginPercent";

export interface MarginRule {
  id: string;
  agencyGroupId: string;
  agencyGroupName: string;
  serviceTypeNameId: string | null;
  serviceTypeName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  optionId: string | null;
  optionName: string | null;
  validFrom: string;
  validTo: string | null;
  marginPercent: number;
  version: number;
}

export interface MarginRulesListResponse {
  items: MarginRule[];
  nextCursor: string | null;
  totalCount: number;
}

export interface MarginRulesListApiResponse {
  items?: MarginRule[] | null;
  nextCursor?: string | null;
  cursor?: string | null;
  totalCount?: number | null;
}

export interface MarginRulesListQueryInput {
  pageSize?: number;
  sortBy?: MarginRuleSortBy;
  sortDirection?: SortDirection;
  search?: string | null;
  agencyGroupId?: string | null;
  serviceTypeId?: string | null;
  supplierId?: string | null;
  serviceId?: string | null;
  optionId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  marginPercent?: string | number | null;
  hideExpired?: boolean;
  includeTotalCount?: boolean;
}

export interface CreateMarginRulePayload {
  agencyGroupId: string;
  serviceTypeId: string | null;
  supplierId: string | null;
  serviceId: string | null;
  optionId: string | null;
  validFrom: string;
  validTo: string | null;
  marginPercent: number;
}

export interface UpdateMarginRulePayload extends CreateMarginRulePayload {
  version: number;
}

export interface DeleteMarginRuleParams {
  marginRuleId: string;
}

export type MarginRuleModalMode = "create" | "edit" | "duplicate";
