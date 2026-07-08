import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

interface DeleteParams {
  optionId: string;
  serviceId: string;
  supplierId?: string | null;
  /** When true, caller handles the error presentation. */
  suppressErrorToast?: boolean;
}

type SupplierServiceCache = {
  id: string;
  options?: { id: string }[];
};

function removeOptionSummary<T extends SupplierServiceCache>(
  service: T,
  optionId: string
): T {
  if (!Array.isArray(service.options)) {
    return service;
  }

  return {
    ...service,
    options: service.options.filter((option) => option.id !== optionId),
  };
}

export function useDeleteServiceOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ optionId }: DeleteParams): Promise<void> => {
      await api.delete(`/catalog/services/options/${optionId}`);
    },
    onSuccess: (_, { serviceId, supplierId, optionId }) => {
      queryClient.setQueryData(
        ["service-options", serviceId],
        (old: unknown) =>
          Array.isArray(old)
            ? old.filter(
                (option) =>
                  !(
                    option &&
                    typeof option === "object" &&
                    "id" in option &&
                    option.id === optionId
                  )
              )
            : old
      );
      queryClient.setQueryData<SupplierServiceCache | null>(
        ["supplier-service", serviceId],
        (old) => (old ? removeOptionSummary(old, optionId) : old)
      );
      if (supplierId) {
        queryClient.setQueryData<SupplierServiceCache[]>(
          ["supplier-services", supplierId],
          (old) =>
            Array.isArray(old)
              ? old.map((service) =>
                  service.id === serviceId
                    ? removeOptionSummary(service, optionId)
                    : service
                )
              : old
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["service-options", serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-service", serviceId],
      });
      if (supplierId) {
        queryClient.invalidateQueries({
          queryKey: ["supplier-services", supplierId],
        });
      }
      toast.success(i18n.t("modals.optionDeletedSuccess", { ns: "admin" }));
    },
    onError: (error, variables) => {
      if (!variables.suppressErrorToast) {
        toast.error(
          getErrorMessage(
            error,
            i18n.t("errors.failedToDeleteOption", { ns: "admin" })
          )
        );
      }
    },
  });
}
