import type { ServiceEligibility } from "../model/types";

export function serviceEligibilitiesQueryKey(serviceId: string | null) {
  return ["service-eligibilities", serviceId] as const;
}

export function appendServiceEligibility(
  previous: ServiceEligibility[] | undefined,
  created: ServiceEligibility
) {
  const list = previous ?? [];

  if (list.some((eligibility) => eligibility.id === created.id)) {
    return list;
  }

  return [...list, created];
}

export function replaceServiceEligibility(
  previous: ServiceEligibility[] | undefined,
  updated: ServiceEligibility
) {
  if (!previous?.length) {
    return [updated];
  }

  const index = previous.findIndex(
    (eligibility) => eligibility.id === updated.id
  );

  if (index === -1) {
    return previous;
  }

  const next = [...previous];
  next[index] = updated;
  return next;
}

export function removeServiceEligibility(
  previous: ServiceEligibility[] | undefined,
  eligibilityId: string
) {
  if (!previous?.length) {
    return [];
  }

  return previous.filter((eligibility) => eligibility.id !== eligibilityId);
}
