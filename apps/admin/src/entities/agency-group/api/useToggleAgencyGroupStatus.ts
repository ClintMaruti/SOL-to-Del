import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { AgencyGroup } from "../model/types";

export interface ToggleAgencyGroupStatusParams {
  agencyGroupId: string;
  active: boolean;
}

export function useToggleAgencyGroupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyGroupId,
      active,
    }: ToggleAgencyGroupStatusParams) => {
      const path = active
        ? `/catalog/agency-groups/${agencyGroupId}/activate`
        : `/catalog/agency-groups/${agencyGroupId}/deactivate`;
      const response = await api.patch<AgencyGroup>(path);
      return response;
    },
    onSuccess: (_, { agencyGroupId, active }) => {
      if (active) {
        toast.success(
          i18n.t("modals.agencyGroupReactivatedSuccess", { ns: "admin" })
        );
      } else {
        toast.success(
          i18n.t("modals.agencyGroupSuspendedSuccess", { ns: "admin" })
        );
      }
      queryClient.setQueryData<AgencyGroup[]>(["agency-groups"], (previous) => {
        if (!Array.isArray(previous)) return previous;
        return previous.map((group) =>
          group.id === agencyGroupId ? { ...group, isActive: active } : group
        );
      });
      queryClient.setQueryData<AgencyGroup>(
        ["agency-group", agencyGroupId],
        (previous) => {
          if (!previous) return previous;
          return { ...previous, isActive: active };
        }
      );
      // Invalidate so background refetch reconciles with server
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
      queryClient.invalidateQueries({
        queryKey: ["agency-group", agencyGroupId],
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateAgencyGroupStatus", { ns: "admin" })
        )
      );
    },
  });
}
