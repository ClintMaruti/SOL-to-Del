import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  normalizeSupplierCloseout,
  supplierCloseoutsQueryKey,
  type SupplierCloseout,
  type SupplierCloseoutDto,
} from "@/entities/supplier-closeout";

export interface CreateSupplierCloseoutPayload {
  supplierId: string;
  travelDateFrom: string;
  travelDateTo: string;
  serviceId: string | null;
  serviceOptionId: string | null;
  reason: string | null;
}

export function useCreateSupplierCloseout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      ...body
    }: CreateSupplierCloseoutPayload): Promise<SupplierCloseout> => {
      const data = await api.post<SupplierCloseoutDto>(
        `/catalog/suppliers/${supplierId}/closeouts`,
        { supplierId, ...body }
      );
      return normalizeSupplierCloseout(data);
    },
    onSuccess: (_data, variables) => {
      toast.success(i18n.t("modals.closeoutCreatedSuccess", { ns: "admin" }));
      queryClient.invalidateQueries({
        queryKey: supplierCloseoutsQueryKey(variables.supplierId),
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateCloseout", { ns: "admin" })
        )
      );
    },
  });
}
