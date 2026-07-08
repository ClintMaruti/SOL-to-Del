import { useCallback, useState } from "react";

import { useDeleteAgencyGroup } from "@/entities/agency-group";
import type { AgencyGroup } from "@/entities/agency-group/model/types";

interface UseDeleteAgencyGroupFormOptions {
  agencyGroup: AgencyGroup | null;
  onSuccess?: () => void;
}

export function useDeleteAgencyGroupForm({
  agencyGroup,
  onSuccess,
}: UseDeleteAgencyGroupFormOptions) {
  const [error, setError] = useState<Error | null>(null);
  const { mutate: deleteAgencyGroup, isPending } = useDeleteAgencyGroup();

  const handleDelete = useCallback(() => {
    if (!agencyGroup) return;

    setError(null);
    deleteAgencyGroup(agencyGroup.id, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err) => {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to delete agency group")
        );
      },
    });
  }, [agencyGroup, deleteAgencyGroup, onSuccess]);

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
