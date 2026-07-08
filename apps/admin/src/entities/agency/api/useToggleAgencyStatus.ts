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

import type { Agency } from "../model/types";

export interface ToggleAgencyStatusParams {
  agencyId: string;
  activate: boolean;
}

export function useToggleAgencyStatus() {
  const queryClient = useQueryClient();
  const { setAgenciesStatus } = useLoadingStates(
    useShallow((state) => ({ setAgenciesStatus: state.setAgenciesStatus }))
  );

  return useMutation({
    mutationFn: async ({ agencyId, activate }: ToggleAgencyStatusParams) => {
      setAgenciesStatus(agencyId, true);
      const path = activate
        ? `/catalog/agencies/${agencyId}/activate`
        : `/catalog/agencies/${agencyId}/deactivate`;
      const response = await api.patch<Agency>(path);
      return response;
    },
    onSuccess: (_, { agencyId }) => {
      setAgenciesStatus(agencyId, false);

      const toggle = (agency: Agency) =>
        agency.id === agencyId
          ? { ...agency, isActive: !agency.isActive }
          : agency;

      updateToggleStatusListCaches({
        queryClient,
        rootQueryKey: ["agencies"],
        entityId: agencyId,
        toggle,
      });

      queryClient.setQueryData<Agency>(["agency", agencyId], (previous) =>
        previous ? { ...previous, isActive: !previous.isActive } : previous
      );
    },
    onError: (error, { agencyId }) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateAgencyStatus", { ns: "admin" })
        )
      );
      setAgenciesStatus(agencyId, false);
    },
  });
}
