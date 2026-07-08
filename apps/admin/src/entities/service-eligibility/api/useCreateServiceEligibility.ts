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
  appendServiceEligibility,
  serviceEligibilitiesQueryKey,
} from "./eligibility-cache";
import type { ServiceEligibilityPayload } from "./eligibility-payload";
import { normalizeServiceEligibility } from "./normalize-service-eligibility";

interface CreateServiceEligibilityParams {
  serviceId: string;
  payload: ServiceEligibilityPayload;
  onCreated?: (created: ServiceEligibility) => void;
}

export function useCreateServiceEligibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      payload,
    }: CreateServiceEligibilityParams): Promise<ServiceEligibility> => {
      const response = await api.post<unknown>(
        `/catalog/services/${serviceId}/eligibilities`,
        payload
      );
      return normalizeServiceEligibility(response);
    },
    onSuccess: (created, { serviceId, onCreated }) => {
      onCreated?.(created);
      queryClient.setQueryData<ServiceEligibility[]>(
        serviceEligibilitiesQueryKey(serviceId),
        (old) => appendServiceEligibility(old, created)
      );
      queryClient.invalidateQueries({
        queryKey: serviceEligibilitiesQueryKey(serviceId),
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateEligibility", { ns: "admin" })
        )
      );
    },
  });
}
