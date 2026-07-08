export interface EligibilityValidityDate {
  id: string;
  from: string;
  to: string;
  version: number;
}

export interface AgeRestriction {
  id?: string;
  ageMin: number | null;
  ageMax: number | null;
  ruleMode: string;
  version: number;
}

export interface PaxTypeConstraint {
  id: string;
  paxType: string;
  paxCode: string;
  minCount: number | null;
  maxCount: number | null;
  ageRestriction?: AgeRestriction;
  version: number;
}

export interface PaxCompositionGroup {
  id: string;
  paxTypeConstraints: PaxTypeConstraint[];
  version: number;
}

export interface ServiceEligibility {
  id: string;
  sequence: number;
  name: string;
  serviceId: string;
  serviceName: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  minAge: number | null;
  totalPaxMin: number | null;
  totalPaxMax: number | null;
  unitsMin: number | null;
  unitsMax: number | null;
  nightsMin: number | null;
  nightsMax: number | null;
  validityDates: EligibilityValidityDate[];
  paxCompositionGroups: PaxCompositionGroup[];
  version: number;
}
