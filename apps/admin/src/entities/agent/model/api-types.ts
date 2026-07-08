import type { CatalogNoteDto } from "@/entities/catalog-extra";

import type { Agent, AgentStatus } from "./types";

/**
 * Form/UI shape for updating an agent.
 * Mapped to API payload in useUpdateAgent (PUT /api/catalog/agents with id in body).
 */
export interface UpdateAgentRequest {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  alternateEmail?: string;
  phone: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  language?: string;
  notes?: CatalogNoteDto | null;
  currency?: string;
  status: AgentStatus;
  version: number;
}

/**
 * Response type for PUT /api/catalog/agents (200 OK). Same structure as Agent.
 */
export type UpdateAgentResponse = Agent;
