import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { Agent } from "@/entities/agent/model/types";
import { useClearURLSearchParam, useDebouncedValue } from "@/shared/hooks";
import { agencyGroupNamesSearchText } from "@/shared/lib";

export function useAgentSearch(agents: Agent[]) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  useClearURLSearchParam();

  const filteredAgents = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return agents;
    }

    return agents.filter((agent) => {
      const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        agent.firstName.toLowerCase().includes(query) ||
        agent.lastName.toLowerCase().includes(query) ||
        (agent.agencyName || "").toLowerCase().includes(query) ||
        agencyGroupNamesSearchText(agent.agencyGroups)
          .toLowerCase()
          .includes(query) ||
        agent.primaryEmail.toLowerCase().includes(query) ||
        (agent.alternateEmail || "").toLowerCase().includes(query) ||
        (agent.phoneNumber ?? "").toLowerCase().includes(query) ||
        (agent.assignedSafariPlannerName ?? "").toLowerCase().includes(query)
      );
    });
  }, [agents, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredAgents,
    hasResults: filteredAgents.length > 0,
  };
}
