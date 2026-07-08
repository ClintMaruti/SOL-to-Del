import { api, useMutation, useQueryClient } from "@sol/api-client";
import { toast } from "@sol/ui";

import type { CreateSupplierFormData } from "@/features/create-supplier";
import { prepareSupplierPayloadForApi } from "@/features/create-supplier/lib/prepareSupplierPayload";

import { normalizeSupplierDetail, type SupplierDetail } from "../model/types";

export type UpdateSupplierPayload = Partial<
  Omit<SupplierDetail, "headOfficeName" | "locationName">
>;

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: UpdateSupplierPayload;
    }): Promise<SupplierDetail | null> => {
      const updated = await api.put<SupplierDetail>(
        `/catalog/suppliers/${supplierId}`,
        prepareSupplierPayloadForApi(
          payload as unknown as CreateSupplierFormData
        )
      );
      return updated ? normalizeSupplierDetail(updated) : null;
    },
    onSuccess: (data, { supplierId }) => {
      // Update supplier detail cache synchronously with PUT response
      // This prevents form sync effect from seeing stale data
      if (data) {
        queryClient.setQueryData<SupplierDetail>(
          ["suppliers", supplierId],
          data
        );
      }

      // Invalidate list queries for background sync
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-head-offices"] });

      toast.success("Supplier updated successfully.");
    },
  });
}
