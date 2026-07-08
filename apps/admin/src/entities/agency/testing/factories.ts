import type { Agency } from "../model/types";

type CreateAgencyOptions = Partial<Omit<Agency, "id" | "name">> & {
  agencyGroupId?: string;
  agencyGroupName?: string;
};

/**
 * Factory function to create mock Agency objects for testing.
 * Uses backend API shape (number, sourceMarketId, isActive, etc.).
 */
export const createAgency = (
  id: string,
  name: string,
  options?: CreateAgencyOptions
): Agency => {
  const agencyGroupIds =
    options?.agencyGroupIds ??
    (options?.agencyGroupId ? [options.agencyGroupId] : ["group-1"]);
  const agencyGroups =
    options?.agencyGroups ??
    agencyGroupIds.map((groupId, index) => ({
      id: groupId,
      name:
        index === 0
          ? (options?.agencyGroupName ?? "Test Agency Group")
          : groupId,
    }));

  return {
    id,
    name,
    sourceMarketId: options?.sourceMarketId ?? "fit",
    iataAgencyCode: options?.iataAgencyCode ?? null,
    email: options?.email ?? `${id}@test.com`,
    number: options?.number ?? "+1234567890",
    country: options?.country ?? null,
    city: options?.city ?? null,
    postalCode: options?.postalCode ?? null,
    address: options?.address ?? null,
    website: options?.website ?? null,
    kenXeroId: options?.kenXeroId ?? null,
    rwXeroId: options?.rwXeroId ?? null,
    tzXeroId: options?.tzXeroId ?? null,
    znzXeroId: options?.znzXeroId ?? null,
    paymentDepositPercent: options?.paymentDepositPercent ?? 100,
    paymentBalanceDueDays: options?.paymentBalanceDueDays ?? 0,
    paymentTaxCode: options?.paymentTaxCode ?? "",
    hasCreditTerms: options?.hasCreditTerms ?? false,
    creditNotes: options?.creditNotes ?? null,
    requiresWhiteLabeling: options?.requiresWhiteLabeling ?? false,
    whiteLabelingNote: options?.whiteLabelingNote ?? null,
    visibilityForAgentZone: options?.visibilityForAgentZone ?? false,
    agentZoneId: options?.agentZoneId ?? null,
    agencyAffiliations: options?.agencyAffiliations ?? null,
    additionalNotes: options?.additionalNotes ?? null,
    isActive: options?.isActive ?? true,
    version: options?.version ?? 0,
    agentsCount: options?.agentsCount,
    agencyGroupIds,
    agencyGroups,
    assignedSafariPlannerId: options?.assignedSafariPlannerId ?? "",
    assignedSafariPlannerName: options?.assignedSafariPlannerName ?? "",
    agents: options?.agents,
    sourceMarketName: options?.sourceMarketName ?? "Test Source Market",
  };
};
