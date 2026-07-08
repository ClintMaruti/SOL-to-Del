export interface CreateAgencyFormData {
  // General Information
  agencyName: string;
  iataCode: string;
  agencyGroupIds: string[];
  sourceMarket: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  // Contacts & Address
  email: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  website: string;
  // Payment Terms
  depositPercent: string;
  balanceDueDays: string;
  taxCode: string;
  // Credit Terms
  hasCreditTerms: boolean;
  creditTermsNote: string;
  // White label
  needsWhiteLabel: boolean;
  whiteLabelNote: string;
  // AgentZone
  agentZoneVisible: boolean;
  agentZoneId: string;
  // Agency Affiliations
  agencyAffiliations: string;
  // Additional IDs
  kenXeroId: string;
  rwXeroId: string;
  tzXeroId: string;
  znzXeroId: string;
  // Additional Notes
  additionalNotes: string;
}
