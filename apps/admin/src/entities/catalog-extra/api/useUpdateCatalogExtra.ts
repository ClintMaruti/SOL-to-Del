import { api, useMutation, useQueryClient } from "@sol/api-client";

import { mergeUpdateExtraIntoDetail } from "../lib/normalize-catalog-extra-detail";
import type { CatalogExtraDetail, CatalogExtraPutBody } from "../model/types";

export interface UpdateCatalogExtraParams {
  extraId: string;
  supplierId: string;
  body: CatalogExtraPutBody;
}

export function useUpdateCatalogExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      extraId,
      body,
    }: UpdateCatalogExtraParams): Promise<CatalogExtraDetail> => {
      const previous = queryClient.getQueryData<CatalogExtraDetail>([
        "catalog-extra",
        extraId,
      ]);
      const raw = await api.put<unknown>(`/catalog/extras/${extraId}`, body);
      return mergeUpdateExtraIntoDetail(raw, previous ?? null);
    },
    onSuccess: (data, { extraId, supplierId }) => {
      queryClient.setQueryData(["catalog-extra", extraId], data);
      queryClient.invalidateQueries({
        queryKey: ["catalog-extras", "supplier", supplierId],
      });
      if (data.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["catalog-extras", "service", data.serviceId],
        });
      }
    },
  });
}
