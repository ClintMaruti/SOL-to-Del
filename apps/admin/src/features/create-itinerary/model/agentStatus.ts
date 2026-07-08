import type { Agent } from "@/entities/agent";

type AgentWithLegacyStatus = Agent & {
  status?: "Active" | "Inactive";
};

export function isCreateItineraryAgentActive(agent: Agent) {
  if (typeof agent.isActive === "boolean") {
    return agent.isActive;
  }

  return (agent as AgentWithLegacyStatus).status === "Active";
}
