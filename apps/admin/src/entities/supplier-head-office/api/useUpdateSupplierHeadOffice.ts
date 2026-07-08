import { api, useMutation, useQueryClient } from "@sol/api-client";

import type {
  SupplierHeadOfficeApiResponse,
  UpdateHeadOfficeApiPayload,
} from "../model/api-types";
import type { SupplierHeadOffice } from "../model/types";

export function useUpdateSupplierHeadOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
    }: {
      payload: UpdateHeadOfficeApiPayload;
    }): Promise<SupplierHeadOffice> => {
      const data = await api.put<SupplierHeadOfficeApiResponse>(
        `/catalog/head-offices`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<SupplierHeadOffice>(
        ["supplier-head-office", data.id],
        data
      );
      queryClient.invalidateQueries({ queryKey: ["supplier-head-offices"] });
      queryClient.invalidateQueries({
        queryKey: ["supplier-head-office", data.id],
      });
      // List rows denormalize headOfficeName; refetch so supplier list columns stay in sync.
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
