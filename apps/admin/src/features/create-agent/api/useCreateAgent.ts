import { api, queryClient, useMutation } from "@sol/api-client";

import type { Agent } from "@/entities/agent/model/types";

import type { CreateAgentSubmitData } from "../model/schema";

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (payload: CreateAgentSubmitData): Promise<Agent> => {
      const data = await api.post<Agent>("/catalog/agents", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      if (data?.agencyId) {
        queryClient.invalidateQueries({
          queryKey: ["agency", data.agencyId],
        });
      }
    },
  });
}
