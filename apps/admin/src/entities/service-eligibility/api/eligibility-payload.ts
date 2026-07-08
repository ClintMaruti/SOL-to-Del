interface PayloadAgeRestriction {
  id?: string;
  ageMin: number | null;
  ageMax: number | null;
  ruleMode: string;
  version: number;
}

interface PayloadPaxTypeConstraint {
  id?: string;
  paxType: string;
  paxCode: string;
  minCount: number;
  maxCount: number;
  ageRestriction?: PayloadAgeRestriction;
  version: number;
}

interface PayloadPaxCompositionGroup {
  id?: string;
  paxTypeConstraints: PayloadPaxTypeConstraint[];
  version?: number;
}

interface PayloadValidityDate {
  id?: string;
  from: string;
  to: string;
  version: number;
}

export interface ServiceEligibilityPayload {
  id?: string;
  serviceId: string;
  version?: number;
  isActive?: boolean;
  minAge: number | null;
  totalPaxMin: number | null;
  totalPaxMax: number | null;
  unitsMin: number | null;
  unitsMax: number | null;
  nightsMin: number | null;
  nightsMax: number | null;
  validityDates: PayloadValidityDate[];
  paxCompositionGroups: PayloadPaxCompositionGroup[];
}
