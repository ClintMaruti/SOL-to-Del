import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { SupplierService, UpdateSupplierServicePayload } from "../types";

interface UpdateSupplierServiceParams {
  serviceId: string;
  supplierId: string;
  payload: UpdateSupplierServicePayload;
}

export function useUpdateSupplierService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      payload,
    }: UpdateSupplierServiceParams): Promise<SupplierService> => {
      const data = await api.put<SupplierService>(
        `/catalog/services/${serviceId}`,
        payload
      );
      return data;
    },
    onSuccess: (data, { supplierId }) => {
      queryClient.setQueryData(["supplier-service", data.id], data);
      queryClient.invalidateQueries({
        queryKey: ["supplier-services", supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-service", data.id],
      });
    },
  });
}
