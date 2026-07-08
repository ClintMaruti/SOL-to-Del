import type { UpdateAgencyPayload } from "@/entities/agency/api/useUpdateAgency";
import type { CatalogNoteDto } from "@/entities/catalog-extra";
import { toCatalogNoteDtoForApi } from "@/entities/catalog-extra";

import type { AgencySubmitData } from "../model/schema";

import type { CreateAgencyRequest } from "./types";

export type FormDataToCreateAgencyRequestOptions = {
  existingAdditionalNotes?: CatalogNoteDto | null;
};

function parsePercent(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : fallback;
}

function parseDays(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  const n = parseInt(trimmed, 10);
  return Number.isInteger(n) ? n : fallback;
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

/**
 * Maps create-agency form submit data to POST /api/catalog/agencies request body.
 */
export function formDataToCreateAgencyRequest(
  data: AgencySubmitData,
  options?: FormDataToCreateAgencyRequestOptions
): CreateAgencyRequest {
  return {
    name: data.agencyName,
    assignedSafariPlannerId: data.assignedSafariPlannerId,
    agencyGroupIds: Array.from(new Set(data.agencyGroupIds)),
    assignedSafariPlannerName: data.assignedSafariPlannerName,
    sourceMarketId: data.sourceMarket,
    iataAgencyCode: emptyToNull(data.iataCode),
    email: data.email,
    number: data.phone,
    country: emptyToNull(data.country),
    city: emptyToNull(data.city),
    postalCode: emptyToNull(data.postalCode),
    address: emptyToNull(data.streetAddress),
    website: emptyToNull(data.website),
    kenXeroId: emptyToNull(data.kenXeroId),
    rwXeroId: emptyToNull(data.rwXeroId),
    tzXeroId: emptyToNull(data.tzXeroId),
    znzXeroId: emptyToNull(data.znzXeroId),
    paymentDepositPercent: parsePercent(data.depositPercent ?? "", 0),
    paymentBalanceDueDays: parseDays(data.balanceDueDays ?? "", 0),
    paymentTaxCode: data.taxCode,
    hasCreditTerms: data.hasCreditTerms,
    creditNotes: emptyToNull(data.creditTermsNote),
    requiresWhiteLabeling: data.needsWhiteLabel,
    whiteLabelingNote: emptyToNull(data.whiteLabelNote),
    visibilityForAgentZone: data.agentZoneVisible,
    agentZoneId: emptyToNull(data.agentZoneId),
    agencyAffiliations: emptyToNull(data.agencyAffiliations),
    additionalNotes: toCatalogNoteDtoForApi(
      options?.existingAdditionalNotes ?? null,
      data.additionalNotes
    ),
  };
}

/**
 * Maps agency form submit data to PUT /api/catalog/agencies/:id request body.
 */
export function formDataToUpdateAgencyPayload(
  data: AgencySubmitData,
  version: number,
  isActive: boolean,
  existingAdditionalNotes?: CatalogNoteDto | null
): UpdateAgencyPayload {
  return {
    ...formDataToCreateAgencyRequest(data, { existingAdditionalNotes }),
    version,
    isActive,
  };
}
