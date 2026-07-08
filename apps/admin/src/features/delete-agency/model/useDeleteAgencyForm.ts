import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDeleteAgency } from "@/entities/agency/api/useDeleteAgency";
import type { Agency } from "@/entities/agency/model/types";

interface UseDeleteAgencyFormOptions {
  agency: Agency | null;
  onSuccess?: () => void;
}

export function useDeleteAgencyForm({
  agency,
  onSuccess,
}: UseDeleteAgencyFormOptions) {
  const { t } = useTranslation("admin");
  const [error, setError] = useState<Error | null>(null);
  const { mutate: deleteAgency, isPending } = useDeleteAgency();

  const handleDelete = useCallback(() => {
    if (!agency) return;

    setError(null);
    deleteAgency(agency.id, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err) => {
        setError(
          err instanceof Error
            ? err
            : new Error(t("errors.failedToDeleteAgency"))
        );
      },
    });
  }, [agency, deleteAgency, onSuccess, t]);

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
