import { api, useMutation, useQueryClient } from "@sol/api-client";

import {
  type CreateHeadOfficeApiRequestPayload,
  type SupplierHeadOffice,
  type SupplierHeadOfficeApiResponse,
} from "@/entities/supplier-head-office";

export function useCreateSupplierHeadOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateHeadOfficeApiRequestPayload
    ): Promise<SupplierHeadOffice> => {
      const data = await api.post<SupplierHeadOfficeApiResponse>(
        "/catalog/head-offices",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-head-offices"] });
    },
  });
}
