import type { Agent } from "@/entities/agent/model/types";
import type { AgencyGroupSummary } from "@/entities/agency-group";
import type { CatalogNoteDto } from "@/entities/catalog-extra";

/**
 * Shared payload shape for POST /api/catalog/agencies and PUT /api/catalog/agencies/:id.
 * Create uses this as-is; update extends it with id and isActive.
 */
export interface AgencyWritePayload {
  name: string;
  sourceMarketId: string;
  agencyGroupIds: string[];
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  iataAgencyCode: string | null;
  email: string;
  number: string;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  website: string | null;
  kenXeroId: string | null;
  rwXeroId: string | null;
  tzXeroId: string | null;
  znzXeroId: string | null;
  paymentDepositPercent: number;
  paymentBalanceDueDays: number;
  paymentTaxCode: string;
  hasCreditTerms: boolean;
  creditNotes: string | null;
  requiresWhiteLabeling: boolean;
  whiteLabelingNote: string | null;
  visibilityForAgentZone: boolean;
  agentZoneId: string | null;
  agencyAffiliations: string | null;
  additionalNotes: CatalogNoteDto | null;
}

/**
 * Normalized Agency entity used inside the admin app.
 * Backend reads may return `agencyGroups` only; agency API hooks derive
 * `agencyGroupIds` from those summaries for form and membership writes.
 */
export interface Agency {
  id: string;
  name: string;
  sourceMarketId: string;
  sourceMarketName: string;
  iataAgencyCode: string | null;
  email: string;
  number: string;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  website: string | null;
  kenXeroId: string | null;
  rwXeroId: string | null;
  tzXeroId: string | null;
  znzXeroId: string | null;
  paymentDepositPercent: number;
  paymentBalanceDueDays: number;
  paymentTaxCode: string;
  hasCreditTerms: boolean;
  creditNotes: string | null;
  requiresWhiteLabeling: boolean;
  whiteLabelingNote: string | null;
  visibilityForAgentZone: boolean;
  agentZoneId: string | null;
  agencyAffiliations: string | null;
  additionalNotes: CatalogNoteDto | null;
  isActive: boolean;
  version: number;
  /** Optional list/detail fields when provided by API */
  agentsCount?: number;
  agencyGroupIds: string[];
  agencyGroups: AgencyGroupSummary[];
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  agents?: Agent[];
}

/** Agency with agents (detail view from GET /catalog/agencies/:id) */
export type AgencyDetail = Agency;
