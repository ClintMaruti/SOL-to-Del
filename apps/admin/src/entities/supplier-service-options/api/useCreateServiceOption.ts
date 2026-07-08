import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { CreateServiceOptionPayload, ServiceOption } from "../model/types";

import {
  prependOptionSummary,
  prependServiceOption,
} from "./service-options-cache";

interface CreateParams extends CreateServiceOptionPayload {
  /** When true (e.g. Save all options), skip per-request success toast; caller shows one summary. */
  suppressSuccessToast?: boolean;
  /** When true, caller handles the error presentation (e.g. field-level validation in a sheet). */
  suppressErrorToast?: boolean;
  /** When set, updates the cached supplier services list (options are nested on each service). */
  supplierId?: string | null;
}

type SupplierServiceCache = {
  id: string;
  options?: {
    id: string;
    name: string;
    isActive: boolean;
    rates?: unknown[];
    ratePlans?: unknown[];
  }[];
};

export function useCreateServiceOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateParams): Promise<ServiceOption> => {
      const payload = { ...params };
      delete payload.suppressSuccessToast;
      delete payload.suppressErrorToast;
      delete payload.supplierId;
      const data = await api.post<ServiceOption>(
        `/catalog/services/${payload.serviceId}/options`,
        payload
      );
      return data;
    },
    onSuccess: (created, { serviceId, supplierId, suppressSuccessToast }) => {
      queryClient.setQueryData<ServiceOption[]>(
        ["service-options", serviceId],
        (old) => prependServiceOption(old, created)
      );
      queryClient.setQueryData<SupplierServiceCache | null>(
        ["supplier-service", serviceId],
        (old) => (old ? prependOptionSummary(old, created) : old)
      );
      if (supplierId) {
        queryClient.setQueryData<SupplierServiceCache[]>(
          ["supplier-services", supplierId],
          (old) =>
            Array.isArray(old)
              ? old.map((service) =>
                  service.id === serviceId
                    ? prependOptionSummary(service, created)
                    : service
                )
              : old
        );
      }
      if (!suppressSuccessToast) {
        toast.success(i18n.t("modals.optionCreatedSuccess", { ns: "admin" }));
      }
    },
    onError: (error, variables) => {
      if (!variables.suppressErrorToast) {
        toast.error(
          getErrorMessage(
            error,
            i18n.t("errors.failedToCreateOption", { ns: "admin" })
          )
        );
      }
    },
  });
}
