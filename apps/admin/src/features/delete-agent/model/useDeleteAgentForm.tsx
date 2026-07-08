import { i18n } from "@sol/i18n";
import { useCallback, useState } from "react";

import { useDeleteAgent } from "@/entities/agent/api/useDeleteAgent";
import type { Agent } from "@/entities/agent/model/types";

interface UseDeleteAgentFormOptions {
  agent: Agent | null;
  onSuccess?: () => void;
}

export function useDeleteAgentForm({
  agent,
  onSuccess,
}: UseDeleteAgentFormOptions) {
  const [error, setError] = useState<Error | null>(null);
  const { mutate: deleteAgent, isPending } = useDeleteAgent();

  const handleDelete = useCallback(() => {
    if (!agent) return;

    setError(null);
    deleteAgent(agent.id, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err) => {
        setError(
          err instanceof Error
            ? err
            : new Error(i18n.t("errors.failedToDeleteAgent", { ns: "admin" }))
        );
      },
    });
  }, [agent, deleteAgent, onSuccess]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleDelete,
    isPending,
    error,
    resetError,
  };
}
