import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { updateToggleStatusListCaches } from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { Agent } from "../model/types";

export interface ToggleAgentStatusParams {
  agentId: string;
  activate: boolean;
}

export function useToggleAgentStatus() {
  const queryClient = useQueryClient();
  const { setAgentsStatus } = useLoadingStates(
    useShallow((state) => ({ setAgentsStatus: state.setAgentsStatus }))
  );
  return useMutation({
    mutationFn: async ({ agentId, activate }: ToggleAgentStatusParams) => {
      setAgentsStatus(agentId, true);
      const path = activate
        ? `/catalog/agents/${agentId}/activate`
        : `/catalog/agents/${agentId}/deactivate`;
      const response = await api.patch<Agent>(path);
      return response;
    },
    onSuccess: (data, { agentId }) => {
      setAgentsStatus(agentId, false);

      const toggle = (agent: Agent) =>
        agent.id === agentId ? { ...agent, isActive: !agent.isActive } : agent;

      updateToggleStatusListCaches({
        queryClient,
        rootQueryKey: ["agents"],
        entityId: agentId,
        toggle,
      });

      queryClient.setQueryData<Agent>(["agent", agentId], (previous) =>
        previous ? { ...previous, isActive: !previous.isActive } : previous
      );

      if (data?.agencyId) {
        queryClient.invalidateQueries({
          queryKey: ["agency", data.agencyId],
        });
      }
    },
    onError: (error, { agentId }) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateAgentStatus", { ns: "admin" })
        )
      );
      setAgentsStatus(agentId, false);
    },
  });
}
