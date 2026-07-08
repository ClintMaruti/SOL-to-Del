/**
 * Maps frontend create-policy payload to API request body for
 * POST /api/catalog/suppliers/contracts/{contractId}/cancellation-policies.
 */

import type {
  PenaltyType,
  ReferenceEvent,
  Starts,
} from "@/entities/supplier-contract";

export interface CreatePolicyApiCondition {
  starts: Starts;
  referenceEvent: ReferenceEvent;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyType: PenaltyType;
  penaltyValue: number;
}

export interface CreatePolicyApiBody {
  policyName: string;
  description: string;
  refundable: boolean;
  isActive: boolean;
  travelDates: CreatePolicyApiTravelDate[];
  conditions: CreatePolicyApiCondition[];
}

export interface CreatePolicyApiTravelDate {
  dateFrom: string;
  dateTo: string | null;
}

export interface CreatePolicyFormTravelDate {
  from: string;
  to: string | null;
}

export interface CreatePolicyFormRule {
  starts: Starts;
  referenceEvent: ReferenceEvent;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyValue: number;
  penaltyType: PenaltyType;
}

export interface CreatePolicyFormBody {
  policyName: string;
  description: string;
  refundable: boolean;
  travelDates: CreatePolicyFormTravelDate[];
  conditions: CreatePolicyFormRule[];
}

export function prepareCreatePolicyRequest(
  form: CreatePolicyFormBody
): CreatePolicyApiBody {
  return {
    policyName: form.policyName,
    description: form.description,
    refundable: form.refundable,
    isActive: false,
    travelDates: form.travelDates.map((range) => ({
      dateFrom: range.from,
      dateTo: range.to || null,
    })),
    conditions: form.conditions.map((rule) => ({
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
