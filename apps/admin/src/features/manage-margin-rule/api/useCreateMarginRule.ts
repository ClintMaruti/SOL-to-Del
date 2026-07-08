import { api, useMutation, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  insertMarginRuleIntoInfiniteCaches,
  toLocalIsoDateString,
  type MarginRule,
} from "@/entities/margin-rule";

import type { CreateMarginRuleVariables } from "../model/types";

function mergeCreatedMarginRule(
  response: Partial<MarginRule> | null | undefined,
  cacheItem: CreateMarginRuleVariables["cacheItem"]
): MarginRule {
  return {
    id: response?.id ?? crypto.randomUUID(),
    agencyGroupId: response?.agencyGroupId ?? cacheItem.agencyGroupId,
    agencyGroupName: response?.agencyGroupName ?? cacheItem.agencyGroupName,
    serviceTypeNameId:
      response?.serviceTypeNameId ?? cacheItem.serviceTypeNameId,
    serviceTypeName: response?.serviceTypeName ?? cacheItem.serviceTypeName,
    supplierId: response?.supplierId ?? cacheItem.supplierId,
    supplierName: response?.supplierName ?? cacheItem.supplierName,
    serviceId: response?.serviceId ?? cacheItem.serviceId,
    serviceName: response?.serviceName ?? cacheItem.serviceName,
    optionId: response?.optionId ?? cacheItem.optionId,
    optionName: response?.optionName ?? cacheItem.optionName,
    validFrom: response?.validFrom ?? cacheItem.validFrom,
    validTo: response?.validTo ?? cacheItem.validTo,
    marginPercent: response?.marginPercent ?? cacheItem.marginPercent,
    version: response?.version ?? 1,
  };
}

export function useCreateMarginRule() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async ({ payload }: CreateMarginRuleVariables) => {
      const response = await api.post<Partial<MarginRule> | null>(
        "/catalog/margin-rules",
        payload
      );

      return response;
    },
    onSuccess: (response, variables) => {
      insertMarginRuleIntoInfiniteCaches(
        queryClient,
        mergeCreatedMarginRule(response, variables.cacheItem),
        toLocalIsoDateString()
      );

      toast.success(i18n.t("modals.marginRuleCreatedSuccess", { ns: "admin" }));
    },
  });
}
