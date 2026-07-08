/** Aligns with edit form field names so shared form cards can be used. */
export interface CreateAgentFormData {
  firstName: string;
  lastName: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  primaryEmail: string;
  phone: string;
  alternateEmail: string;
  notes: string;
}

export interface CreateAgentFormErrors {
  firstName?: string;
  lastName?: string;
  agencyId?: string;
  assignedSafariPlannerId?: string;
  primaryEmail?: string;
}
