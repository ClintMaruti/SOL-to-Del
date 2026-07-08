import type { CatalogNoteDto } from "@/entities/catalog-extra";
import type { AgencyGroupSummary } from "@/entities/agency-group";

export type AgentStatus = "Active" | "Inactive";

export interface Agent {
  id: string;
  version: number;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  phoneNumber: string;
  agencyId: string;
  agencyName?: string;
  agencyGroups: AgencyGroupSummary[];
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  isActive: boolean;
  alternateEmail?: string;
  language?: string;
  notes?: CatalogNoteDto | null;
  currency?: string;
}
