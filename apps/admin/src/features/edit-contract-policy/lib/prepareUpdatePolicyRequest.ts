/**
 * Maps frontend update-policy payload to API request body for
 * PUT /api/catalog/suppliers/contracts/cancellation-policies/{id}.
 *
 * Conditions present → kept/updated; absent → deleted (full replace semantics).
 */

import type {
  PenaltyType,
  ReferenceEvent,
  Starts,
} from "@/entities/supplier-contract";

export interface UpdatePolicyApiCondition {
  id?: string;
  starts: Starts;
  referenceEvent: ReferenceEvent;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyType: PenaltyType;
  penaltyValue: number;
}

export interface UpdatePolicyApiBody {
  id: string;
  contractId: string;
  policyName: string;
  description: string;
  refundable: boolean;
  isActive: boolean;
  travelDates: UpdatePolicyApiTravelDate[];
  conditions: UpdatePolicyApiCondition[];
}

export interface UpdatePolicyApiTravelDate {
  id?: string;
  version?: number;
  dateFrom: string;
  dateTo: string | null;
}

export interface UpdatePolicyFormTravelDate {
  id?: string;
  version?: number;
  from: string;
  to: string | null;
}

export interface UpdatePolicyFormRule {
  id?: string;
  starts: Starts;
  referenceEvent: ReferenceEvent;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyValue: number;
  penaltyType: PenaltyType;
}

export interface UpdatePolicyFormBody {
  policyName: string;
  description: string;
  refundable: boolean;
  travelDates: UpdatePolicyFormTravelDate[];
  conditions: UpdatePolicyFormRule[];
}

export function prepareUpdatePolicyRequest(
  form: UpdatePolicyFormBody,
  isActive: boolean,
  policyId: string,
  contractId: string
): UpdatePolicyApiBody {
  return {
    id: policyId,
    contractId,
    policyName: form.policyName,
    description: form.description,
    refundable: form.refundable,
    isActive,
    travelDates: form.travelDates.map((range) => ({
      id: range.id,
      version: range.version,
      dateFrom: range.from,
      dateTo: range.to || null,
    })),
    conditions: form.conditions.map((rule) => ({
      id: rule.id,
      starts: rule.starts,
      referenceEvent: rule.referenceEvent,
      startDay: rule.startDay,
      startTime: rule.startTime,
      endDay: rule.endDay,
      endTime: rule.endTime,
      penaltyType: rule.penaltyType,
      penaltyValue: rule.penaltyValue,
    })),
  };
}
