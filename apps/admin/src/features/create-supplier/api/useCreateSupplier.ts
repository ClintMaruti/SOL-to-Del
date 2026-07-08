import { api, useMutation, useQueryClient } from "@sol/api-client";

import {
  normalizeSupplierDetail,
  type SupplierDetail,
} from "@/entities/suppliers/model/types";

import { prepareSupplierPayloadForApi } from "../lib/prepareSupplierPayload";
import type { CreateSupplierFormData } from "../model/types";

export type CreatedSupplier = SupplierDetail;

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateSupplierFormData
    ): Promise<CreatedSupplier> => {
      const created = await api.post<SupplierDetail>(
        "/catalog/suppliers",
        prepareSupplierPayloadForApi(payload)
      );
      return normalizeSupplierDetail(created);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData<SupplierDetail>(["suppliers", data.id], data);
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-head-offices"] });
      if (data?.headOfficeId) {
        queryClient.invalidateQueries({
          queryKey: ["supplier-head-office", data.headOfficeId],
        });
      }
    },
  });
}
