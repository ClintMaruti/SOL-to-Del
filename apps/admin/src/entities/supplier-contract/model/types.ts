export type Starts = "Before" | "After";
export type ReferenceEvent = "TravelDate" | "BookingDate";
export type PenaltyType = "Percent" | "Value";

export interface PenaltyRule {
  id: string;
  starts: Starts;
  referenceEvent: ReferenceEvent;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyValue: number;
  penaltyType: PenaltyType;
}

export interface ContractPolicyTravelDate {
  id?: string;
  version?: number;
  from: string;
  to?: string | null;
}

export interface ContractPolicyTravelDateDto {
  id?: string;
  version?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
}

/**
 * Policy on a contract. GET /catalog/contracts/:id returns policies as a summary
 * (id, name, version only). Full policy (description, refundable, isActive, conditions)
 * is returned when fetching a single policy or from create/update.
 */
export interface ContractPolicy {
  id: string;
  description?: string;
  refundable?: boolean;
  isActive?: boolean;
  version?: number;
  conditions?: PenaltyRule[];
  travelDates?: ContractPolicyTravelDate[];
  policyName: string;
}

/** Raw policy shape from the API — may use `name` or `policyName` depending on the endpoint. */
export type ContractPolicyDto = Omit<
  ContractPolicy,
  "policyName" | "travelDates"
> & {
  policyName?: string;
  name?: string;
  travelDates?: ContractPolicyTravelDateDto[];
};

function normalizeTravelDate(
  dto: ContractPolicyTravelDateDto
): ContractPolicyTravelDate {
  return {
    id: dto.id,
    version: dto.version,
    from: dto.dateFrom ?? "",
    to: dto.dateTo ?? null,
  };
}

/** Normalize whichever name field the API returns into the canonical `policyName`. */
export function normalizeContractPolicy(
  dto: ContractPolicyDto
): ContractPolicy {
  const { name, travelDates, ...policy } = dto;

  return {
    ...policy,
    policyName: dto.policyName ?? name ?? "",
    travelDates: Array.isArray(travelDates)
      ? travelDates.map(normalizeTravelDate)
      : undefined,
  };
}

/**
 * Supplier contract. GET /catalog/contracts/:id returns this shape:
 * id, supplierId, name, link, validFrom, validTo, isActive, version, closeouts, policies.
 */
export interface SupplierContract {
  id: string;
  supplierId?: string;
  /** Present when the API links the contract to a catalog service. */
  serviceId?: string;
  name: string;
  link: string | null;
  /** Nullable scope: null/undefined means generic ANY fallback. */
  agencyGroupId?: string | null;
  agencyGroupName?: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  /**
   * True when the contract has no dependent entities.
   * Retained for API compatibility; saved contract detail does not expose delete.
   */
  canDelete?: boolean;
  policies?: ContractPolicy[];
}

export function getSupplierContractAgencyGroupDisplayName(
  contract: Pick<SupplierContract, "agencyGroupId" | "agencyGroupName">
): string {
  const agencyGroupName = contract.agencyGroupName?.trim();
  if (agencyGroupName) return agencyGroupName;
  if (!contract.agencyGroupId) return "ANY";
  return contract.agencyGroupId;
}
