import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { CatalogNoteDto } from "@/entities/catalog-extra";

import type { UpdateAgentRequest } from "../model/api-types";
import type { Agent } from "../model/types";

/** Request body for PUT /api/catalog/agents (backend expects id and these fields in body) */
interface UpdateAgentApiPayload {
  id: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  alternateEmail?: string;
  phoneNumber: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  language?: string;
  notes?: CatalogNoteDto | null;
  currency?: string;
  isActive: boolean;
  version: number;
}

function toUpdateAgentPayload(
  id: string,
  data: UpdateAgentRequest
): UpdateAgentApiPayload {
  return {
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    primaryEmail: data.primaryEmail,
    alternateEmail: data.alternateEmail || undefined,
    phoneNumber: data.phone,
    agencyId: data.agencyId,
    assignedSafariPlannerId: data.assignedSafariPlannerId,
    assignedSafariPlannerName: data.assignedSafariPlannerName,
    language: data.language,
    notes: data.notes,
    currency: data.currency,
    isActive: data.status === "Active",
    version: data.version,
  };
}

/**
 * Hook to update an agent.
 * Backend: PUT /api/catalog/agents (no id in path); id and fields sent in body.
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation<Agent, Error, { id: string; data: UpdateAgentRequest }>({
    mutationFn: async ({ id, data }) => {
      const payload = toUpdateAgentPayload(id, data);
      const result = await api.put<Agent>("/catalog/agents", {
        ...payload,
        id,
      });
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      if (data?.agencyId) {
        queryClient.invalidateQueries({ queryKey: ["agency", data.agencyId] });
      }
    },
  });
}
