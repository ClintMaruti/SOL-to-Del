import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ServiceEligibility } from "../model/types";

import {
  removeServiceEligibility,
  serviceEligibilitiesQueryKey,
} from "./eligibility-cache";

interface DeleteServiceEligibilityParams {
  eligibilityId: string;
  serviceId: string;
}

interface DeleteServiceEligibilityContext {
  previousEligibilities: ServiceEligibility[] | undefined;
  hadPreviousEligibilities: boolean;
}

export function useDeleteServiceEligibility() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    DeleteServiceEligibilityParams,
    DeleteServiceEligibilityContext
  >({
    mutationFn: async ({
      eligibilityId,
    }: DeleteServiceEligibilityParams): Promise<void> => {
      await api.delete(`/catalog/eligibilities/${eligibilityId}`);
    },
    onMutate: async ({ eligibilityId, serviceId }) => {
      const queryKey = serviceEligibilitiesQueryKey(serviceId);

      await queryClient.cancelQueries({ queryKey });

      const previousEligibilities =
        queryClient.getQueryData<ServiceEligibility[]>(queryKey);

      queryClient.setQueryData<ServiceEligibility[]>(queryKey, (old) =>
        removeServiceEligibility(old, eligibilityId)
      );

      return {
        previousEligibilities,
        hadPreviousEligibilities: previousEligibilities !== undefined,
      };
    },
    onSuccess: () => {
      toast.success(
        i18n.t("modals.eligibilityDeletedSuccess", { ns: "admin" })
      );
    },
    onError: (error, { serviceId }, context) => {
      if (context?.hadPreviousEligibilities) {
        queryClient.setQueryData(
          serviceEligibilitiesQueryKey(serviceId),
          context.previousEligibilities
        );
      }

      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToDeleteEligibility", { ns: "admin" })
        )
      );
    },
    onSettled: (_, __, { serviceId }) => {
      queryClient.invalidateQueries({
        queryKey: serviceEligibilitiesQueryKey(serviceId),
      });
    },
  });
}
