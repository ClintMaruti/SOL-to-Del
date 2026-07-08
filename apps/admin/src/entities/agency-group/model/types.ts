export type AgencyGroupStatus = "Active" | "Inactive";

export interface AgencyGroupSummary {
  id: string;
  name: string;
}

export interface AgencyGroup {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  numberOfAgencies: number;
  version: number;
}
