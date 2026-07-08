import { api, useQuery } from "@sol/api-client";

import {
  normalizeAgencies,
  type AgencyApiResponse,
} from "../lib/normalizeAgency";
import type { Agency } from "../model/types";

export function useAgencies(agencyGroupIds?: string[] | string | null) {
  const normalizedAgencyGroupIds =
    typeof agencyGroupIds === "string"
      ? [agencyGroupIds]
      : (agencyGroupIds ?? []);
  const filteredAgencyGroupIds = Array.from(
    new Set(normalizedAgencyGroupIds.filter(Boolean))
  ).sort();
  const queryKey =
    filteredAgencyGroupIds.length > 0
      ? (["agencies", { agencyGroupIds: filteredAgencyGroupIds }] as const)
      : (["agencies"] as const);

  return useQuery<Agency[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      for (const id of filteredAgencyGroupIds) {
        params.append("agencyGroupIds", id);
      }
      const query = params.toString();
      const data = await api.get<AgencyApiResponse[]>(
        `/catalog/agencies${query ? `?${query}` : ""}`
      );
      return normalizeAgencies(data);
    },
  });
}
