import type {
  ServiceEligibility,
  ServiceEligibilityPayload,
} from "@/entities/service-eligibility";

import type { EligibilityFormValues } from "./useEligibilityForm";

export const LOCAL_ELIG_PREFIX = "local-elig-";

const LOCAL_ID_PREFIXES = ["pcg-", "ptc-", "vd-"];

function nextBrowserId() {
  return crypto.randomUUID();
}

function isLocalId(id: string | undefined) {
  return (
    Boolean(id) && LOCAL_ID_PREFIXES.some((prefix) => id!.startsWith(prefix))
  );
}

export function createDefaultEligibilityDraft(
  serviceId: string,
  serviceName: string,
  sequence: number,
  name: string
): ServiceEligibility {
  return {
    id: `${LOCAL_ELIG_PREFIX}${nextBrowserId()}`,
    sequence,
    name,
    serviceId,
    serviceName,
    isActive: false,
    validFrom: "",
    validTo: "",
    minAge: null,
    totalPaxMin: null,
    totalPaxMax: null,
    unitsMin: null,
    unitsMax: null,
    nightsMin: null,
    nightsMax: null,
    validityDates: [],
    paxCompositionGroups: [],
    version: 0,
  };
}

export function duplicateEligibilityDraft(
  source: ServiceEligibility,
  serviceId: string,
  serviceName: string,
  sequence: number,
  name: string
): ServiceEligibility {
  return {
    ...source,
    id: `${LOCAL_ELIG_PREFIX}${nextBrowserId()}`,
    serviceId,
    serviceName,
    name,
    sequence,
    isActive: false,
    version: 0,
    validityDates: source.validityDates.map((vd) => ({
      ...vd,
      id: `vd-${nextBrowserId()}`,
      version: 0,
    })),
    paxCompositionGroups: source.paxCompositionGroups.map((group) => ({
      ...group,
      id: `pcg-${nextBrowserId()}`,
      version: 0,
      paxTypeConstraints: group.paxTypeConstraints.map((constraint) => ({
        ...constraint,
        id: `ptc-${nextBrowserId()}`,
        version: 0,
        ageRestriction: constraint.ageRestriction
          ? {
              ...constraint.ageRestriction,
              id: undefined,
              version: 0,
            }
          : undefined,
      })),
    })),
  };
}

export function buildServiceEligibilityPayload(
  serviceId: string,
  id: string,
  values: EligibilityFormValues,
  version: number
): ServiceEligibilityPayload {
  return {
    id: id.startsWith(LOCAL_ELIG_PREFIX) ? undefined : id,
    serviceId,
    version,
    isActive: values.isActive,
    minAge: values.minimumAge,
    totalPaxMin: values.totalPaxMin,
    totalPaxMax: values.totalPaxMax,
    unitsMin: values.unitsMin,
    unitsMax: values.unitsMax,
    nightsMin: values.nightsMin,
    nightsMax: values.nightsMax,
    validityDates: values.validityDates.map((vd) => ({
      ...(isLocalId(vd.id) ? {} : { id: vd.id }),
      from: vd.from,
      to: vd.to,
      version: vd.version,
    })),
    paxCompositionGroups: values.paxCompositionGroups.map((group) => ({
      ...(isLocalId(group.id) ? {} : { id: group.id }),
      version: group.version,
      paxTypeConstraints: group.paxTypeConstraints.map((constraint) => ({
        ...(isLocalId(constraint.id) ? {} : { id: constraint.id }),
        paxType: constraint.paxType,
        paxCode: constraint.paxCode,
        minCount: constraint.minCount ?? 0,
        maxCount: constraint.maxCount ?? 0,
        version: constraint.version,
        ...(constraint.ageRestriction
          ? {
              ageRestriction: {
                ...(constraint.ageRestriction.id &&
                !isLocalId(constraint.ageRestriction.id)
                  ? { id: constraint.ageRestriction.id }
                  : {}),
                ageMin: constraint.ageRestriction.ageMin,
                ageMax: constraint.ageRestriction.ageMax,
                ruleMode: constraint.ageRestriction.ruleMode,
                version: constraint.ageRestriction.version,
              },
            }
          : {}),
      })),
    })),
  };
}
