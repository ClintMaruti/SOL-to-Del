import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { ServiceOption, UpdateServiceOptionPayload } from "../model/types";

import {
  replaceOptionSummary,
  replaceServiceOption,
} from "./service-options-cache";

interface UpdateParams {
  optionId: string;
  serviceId: string;
  payload: UpdateServiceOptionPayload;
  /** When true (e.g. Save all options), skip per-request success toast; caller shows one summary. */
  suppressSuccessToast?: boolean;
  /** When true, caller handles the error presentation. */
  suppressErrorToast?: boolean;
  supplierId?: string | null;
}

type ServiceOptionSummary = {
  id: string;
  name: string;
  isActive: boolean;
};

type SupplierServiceCache = {
  id: string;
  options?: ServiceOptionSummary[];
};

export function useUpdateServiceOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      optionId,
      payload,
    }: UpdateParams): Promise<ServiceOption> => {
      const data = await api.put<ServiceOption>(
        `/catalog/services/options/${optionId}`,
        payload
      );
      return data;
    },
    onSuccess: (data, { serviceId, supplierId, suppressSuccessToast }) => {
      queryClient.setQueryData<ServiceOption[]>(
        ["service-options", serviceId],
        (old) => replaceServiceOption(old, data)
      );
      queryClient.setQueryData<SupplierServiceCache | null>(
        ["supplier-service", serviceId],
        (old) => (old ? replaceOptionSummary(old, data) : old)
      );
      if (supplierId) {
        queryClient.setQueryData<SupplierServiceCache[]>(
          ["supplier-services", supplierId],
          (old) =>
            Array.isArray(old)
              ? old.map((service) =>
                  service.id === serviceId
                    ? replaceOptionSummary(service, data)
                    : service
                )
              : old
        );
      }
      if (!suppressSuccessToast) {
        toast.success(i18n.t("modals.optionUpdatedSuccess", { ns: "admin" }));
      }
    },
    onError: (error, variables) => {
      if (!variables.suppressErrorToast) {
        toast.error(
          getErrorMessage(
            error,
            i18n.t("errors.failedToUpdateOption", { ns: "admin" })
          )
        );
      }
    },
  });
}
