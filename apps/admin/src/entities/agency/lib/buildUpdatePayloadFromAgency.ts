import type { UpdateAgencyPayload } from "../api/useUpdateAgency";
import type { Agency } from "../model/types";

/** Backend requires non-empty paymentTaxCode; use placeholder when null/empty. */
const PAYMENT_TAX_CODE_FALLBACK = "N/A";

function toNumber(value: unknown, fallback: number): number {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Builds UpdateAgencyPayload from an Agency (e.g. from GET /catalog/agencies list)
 * with overridden agencyGroupIds. Used when assigning/removing agencies from a group.
 * Coerces values to satisfy backend validation (e.g. paymentTaxCode non-empty,
 * agentZoneId when visibilityForAgentZone is true, numeric payment fields).
 */
export function buildUpdatePayloadFromAgency(
  agency: Agency,
  overrides: { agencyGroupIds: string[] }
): UpdateAgencyPayload {
  const paymentDepositPercent = toNumber(agency.paymentDepositPercent, 0);
  const paymentBalanceDueDays = toNumber(agency.paymentBalanceDueDays, 0);

  const paymentTaxCode =
    agency.paymentTaxCode != null && String(agency.paymentTaxCode).trim() !== ""
      ? agency.paymentTaxCode
      : PAYMENT_TAX_CODE_FALLBACK;

  const visibilityForAgentZone = Boolean(agency.visibilityForAgentZone);
  const agentZoneId = agency.agentZoneId ?? null;
  const hasAgentZoneId =
    agentZoneId != null && String(agentZoneId).trim() !== "";
  const effectiveVisibility =
    visibilityForAgentZone && hasAgentZoneId ? true : false;
  const effectiveAgentZoneId = effectiveVisibility ? agentZoneId : null;

  return {
    version: agency.version,
    isActive: agency.isActive,
    name: agency.name,
    sourceMarketId: agency.sourceMarketId,
    agencyGroupIds: Array.from(new Set(overrides.agencyGroupIds)),
    assignedSafariPlannerId: agency.assignedSafariPlannerId,
    assignedSafariPlannerName: agency.assignedSafariPlannerName,
    iataAgencyCode: agency.iataAgencyCode,
    email: agency.email,
    number: agency.number,
    country: agency.country,
    city: agency.city,
    postalCode: agency.postalCode,
    address: agency.address,
    website: agency.website,
    kenXeroId: agency.kenXeroId,
    rwXeroId: agency.rwXeroId,
    tzXeroId: agency.tzXeroId,
    znzXeroId: agency.znzXeroId,
    paymentDepositPercent,
    paymentBalanceDueDays,
    paymentTaxCode,
    hasCreditTerms: agency.hasCreditTerms,
    creditNotes: agency.creditNotes,
    requiresWhiteLabeling: agency.requiresWhiteLabeling,
    whiteLabelingNote: agency.whiteLabelingNote,
    visibilityForAgentZone: effectiveVisibility,
    agentZoneId: effectiveAgentZoneId,
    agencyAffiliations: agency.agencyAffiliations,
    additionalNotes: agency.additionalNotes,
  };
}
