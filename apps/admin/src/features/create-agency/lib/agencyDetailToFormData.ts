import type { AgencyDetail } from "@/entities/agency/model/types";
import type { SourceMarket } from "@/entities/source-market/model/types";

import type { CreateAgencyFormData } from "../model/types";

/**
 * Resolve backend sourceMarketId to an option id that exists in the source-markets list
 * (match by id, code, or name so the dropdown can show the selection).
 */
function resolveSourceMarketId(
  raw: string,
  sourceMarkets: SourceMarket[]
): string {
  if (!raw || !sourceMarkets.length) return raw;
  const lower = raw.toLowerCase();
  const match = sourceMarkets.find(
    (sm) =>
      sm.id === raw ||
      sm.id.toLowerCase() === lower ||
      (sm.code && (sm.code === raw || sm.code.toLowerCase() === lower)) ||
      sm.name === raw ||
      sm.name.toLowerCase() === lower
  );
  return match ? match.id : raw;
}

/**
 * Map API agency detail (backend shape) to form data for the shared agency form (view/update).
 * When sourceMarkets are provided, sourceMarket is resolved to an option id so the dropdown displays correctly.
 */
export function agencyDetailToFormData(
  detail: AgencyDetail,
  sourceMarkets?: SourceMarket[]
): CreateAgencyFormData {
  const rawSourceMarket = detail.sourceMarketId ?? "";
  const sourceMarket = sourceMarkets?.length
    ? resolveSourceMarketId(rawSourceMarket, sourceMarkets)
    : rawSourceMarket;

  return {
    agencyName: detail.name ?? "",
    iataCode: detail.iataAgencyCode ?? "",
    agencyGroupIds: detail.agencyGroupIds ?? [],
    sourceMarket,
    assignedSafariPlannerId: detail.assignedSafariPlannerId ?? "",
    assignedSafariPlannerName: detail.assignedSafariPlannerName ?? "",
    email: detail.email ?? "",
    phone: detail.number ?? "",
    country: detail.country ?? "",
    city: detail.city ?? "",
    postalCode: detail.postalCode ?? "",
    streetAddress: detail.address ?? "",
    website: detail.website ?? "",
    depositPercent:
      detail.paymentDepositPercent != null
        ? String(detail.paymentDepositPercent)
        : "",
    balanceDueDays:
      detail.paymentBalanceDueDays != null
        ? String(detail.paymentBalanceDueDays)
        : "",
    taxCode: detail.paymentTaxCode ?? "",
    hasCreditTerms: detail.hasCreditTerms ?? false,
    creditTermsNote: detail.creditNotes ?? "",
    needsWhiteLabel: detail.requiresWhiteLabeling ?? false,
    whiteLabelNote: detail.whiteLabelingNote ?? "",
    agentZoneVisible: detail.visibilityForAgentZone ?? false,
    agentZoneId: detail.agentZoneId ?? "",
    agencyAffiliations: detail.agencyAffiliations ?? "",
    kenXeroId: detail.kenXeroId ?? "",
    rwXeroId: detail.rwXeroId ?? "",
    tzXeroId: detail.tzXeroId ?? "",
    znzXeroId: detail.znzXeroId ?? "",
    additionalNotes: detail.additionalNotes?.text ?? "",
  };
}
