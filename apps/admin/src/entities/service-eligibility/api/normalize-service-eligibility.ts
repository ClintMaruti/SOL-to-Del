import type {
  AgeRestriction,
  EligibilityValidityDate,
  PaxCompositionGroup,
  PaxTypeConstraint,
  ServiceEligibility,
} from "../model/types";

type RawAgeRestriction = Partial<AgeRestriction> | null | undefined;

type RawPaxTypeConstraint =
  | (Partial<PaxTypeConstraint> & { ageRestriction?: RawAgeRestriction })
  | null
  | undefined;

type RawPaxCompositionGroup =
  | (Partial<PaxCompositionGroup> & {
      paxTypeConstraints?: RawPaxTypeConstraint[] | null;
    })
  | null
  | undefined;

type RawServiceEligibility = Partial<
  Omit<
    ServiceEligibility,
    "paxCompositionGroups" | "validityDates" | "validFrom" | "validTo"
  >
> & {
  minimumAge?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  validityDates?: EligibilityValidityDate[] | null;
  paxCompositionGroups?: RawPaxCompositionGroup[] | null;
};

function normalizeAgeRestriction(
  ageRestriction: RawAgeRestriction
): AgeRestriction | undefined {
  if (!ageRestriction) return undefined;

  return {
    ...ageRestriction,
    ageMin: ageRestriction.ageMin ?? null,
    ageMax: ageRestriction.ageMax ?? null,
    ruleMode: ageRestriction.ruleMode ?? "",
    version: ageRestriction.version ?? 0,
  };
}

function normalizePaxTypeConstraint(
  constraint: RawPaxTypeConstraint
): PaxTypeConstraint | null {
  if (!constraint?.id) return null;

  return {
    id: constraint.id,
    paxType: constraint.paxType ?? constraint.paxCode ?? "",
    paxCode: constraint.paxCode ?? constraint.paxType ?? "",
    minCount: constraint.minCount ?? null,
    maxCount: constraint.maxCount ?? null,
    ageRestriction: normalizeAgeRestriction(constraint.ageRestriction),
    version: constraint.version ?? 0,
  };
}

function normalizePaxCompositionGroup(
  group: RawPaxCompositionGroup
): PaxCompositionGroup | null {
  if (!group?.id) return null;

  return {
    id: group.id,
    version: group.version ?? 0,
    paxTypeConstraints: Array.isArray(group.paxTypeConstraints)
      ? group.paxTypeConstraints
          .map(normalizePaxTypeConstraint)
          .filter((constraint): constraint is PaxTypeConstraint =>
            Boolean(constraint)
          )
      : [],
  };
}

export function normalizeServiceEligibility(
  eligibilityInput: unknown
): ServiceEligibility {
  const eligibility =
    eligibilityInput && typeof eligibilityInput === "object"
      ? (eligibilityInput as RawServiceEligibility)
      : ({} as RawServiceEligibility);

  return {
    id: eligibility.id ?? "",
    sequence: eligibility.sequence ?? 0,
    name: eligibility.name ?? "",
    serviceId: eligibility.serviceId ?? "",
    serviceName: eligibility.serviceName ?? "",
    isActive: eligibility.isActive ?? false,
    validFrom: eligibility.validFrom ?? "",
    validTo: eligibility.validTo ?? "",
    minAge: eligibility.minAge ?? eligibility.minimumAge ?? null,
    totalPaxMin: eligibility.totalPaxMin ?? null,
    totalPaxMax: eligibility.totalPaxMax ?? null,
    unitsMin: eligibility.unitsMin ?? null,
    unitsMax: eligibility.unitsMax ?? null,
    nightsMin: eligibility.nightsMin ?? null,
    nightsMax: eligibility.nightsMax ?? null,
    validityDates: Array.isArray(eligibility.validityDates)
      ? eligibility.validityDates
      : [],
    paxCompositionGroups: Array.isArray(eligibility.paxCompositionGroups)
      ? eligibility.paxCompositionGroups
          .map(normalizePaxCompositionGroup)
          .filter((group): group is PaxCompositionGroup => Boolean(group))
      : [],
    version: eligibility.version ?? 0,
  };
}

export function normalizeServiceEligibilityList(
  eligibilities: unknown
): ServiceEligibility[] {
  if (!Array.isArray(eligibilities)) {
    return [];
  }

  return eligibilities.map((eligibility) =>
    normalizeServiceEligibility(eligibility)
  );
}
