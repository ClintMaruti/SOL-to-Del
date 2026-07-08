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
  replaceServiceEligibility,
  serviceEligibilitiesQueryKey,
} from "./eligibility-cache";
import type { ServiceEligibilityPayload } from "./eligibility-payload";
import { normalizeServiceEligibility } from "./normalize-service-eligibility";

interface UpdateServiceEligibilityParams {
  eligibilityId: string;
  serviceId: string;
  payload: ServiceEligibilityPayload;
}

export function useUpdateServiceEligibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eligibilityId,
      payload,
    }: UpdateServiceEligibilityParams): Promise<ServiceEligibility> => {
      const response = await api.put<unknown>(
        `/catalog/eligibilities/${eligibilityId}`,
        payload
      );
      return normalizeServiceEligibility(response);
    },
    onSuccess: (updated, { serviceId }) => {
      queryClient.setQueryData<ServiceEligibility[]>(
        serviceEligibilitiesQueryKey(serviceId),
        (old) => replaceServiceEligibility(old, updated)
      );
      queryClient.invalidateQueries({
        queryKey: serviceEligibilitiesQueryKey(serviceId),
      });
      toast.success(
        i18n.t("modals.eligibilityUpdatedSuccess", { ns: "admin" })
      );
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateEligibility", { ns: "admin" })
        )
      );
    },
  });
}
