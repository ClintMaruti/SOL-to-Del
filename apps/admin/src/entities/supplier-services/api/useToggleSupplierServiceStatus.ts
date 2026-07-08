import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useShallow } from "zustand/react/shallow";

import { useLoadingStates } from "@/shared/stores/loadingStates";

import type { SupplierService } from "../types";

interface ToggleSupplierServiceStatusParams {
  serviceId: string;
  supplierId: string;
  isActive: boolean;
}

export function useToggleSupplierServiceStatus() {
  const queryClient = useQueryClient();
  const { setSupplierServicesStatus } = useLoadingStates(
    useShallow((state) => ({
      setSupplierServicesStatus: state.setSupplierServicesStatus,
    }))
  );

  return useMutation({
    mutationFn: async ({
      serviceId,
      isActive,
    }: ToggleSupplierServiceStatusParams) => {
      setSupplierServicesStatus(serviceId, true);
      const url = isActive
        ? `/catalog/services/${serviceId}/deactivate`
        : `/catalog/services/${serviceId}/activate`;
      const response = await api.patch<SupplierService>(url);
      return response;
    },
    onSuccess: (_data, { serviceId, supplierId }) => {
      setSupplierServicesStatus(serviceId, false);
      queryClient.setQueryData<SupplierService[]>(
        ["supplier-services", supplierId],
        (previous) => {
          if (!previous) return previous;
          return previous.map((s) =>
            s.id === serviceId ? { ...s, isActive: !s.isActive } : s
          );
        }
      );
      queryClient.setQueryData<SupplierService>(
        ["supplier-service", serviceId],
        (previous) => {
          if (!previous) return previous;
          return { ...previous, isActive: !previous.isActive };
        }
      );
    },
    onError: (error, { serviceId }) => {
      setSupplierServicesStatus(serviceId, false);
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateSupplierServiceStatus", {
            ns: "admin",
          })
        )
      );
    },
  });
}
