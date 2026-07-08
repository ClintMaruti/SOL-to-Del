import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { SupplierService } from "@/entities/supplier-services/types";

import type { CreateSupplierServicePayload } from "../model/type";

export function useCreateSupplierService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSupplierServicePayload) => {
      const data = await api.post<SupplierService>(
        `/catalog/services`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        i18n.t("modals.supplierServiceCreatedSuccess", { ns: "admin" })
      );
      queryClient.invalidateQueries({
        queryKey: ["supplier-services", variables.supplierId],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(
        error,
        i18n.t("errors.failedToCreateSupplierService", { ns: "admin" })
      );
      toast.error(errorMessage);
    },
  });
}
