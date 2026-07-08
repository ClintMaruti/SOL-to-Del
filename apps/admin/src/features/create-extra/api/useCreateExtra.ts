import { api, useMutation, useQueryClient } from "@sol/api-client";

import { normalizeCatalogExtraListItem } from "@/entities/catalog-extra/lib/normalizeCatalogExtraListItem";

export interface CreateExtraMutationInput {
  supplierId: string;
  title: string;
  description: string | null;
  serviceIds?: string[];
}

export function useCreateExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExtraMutationInput) => {
      const raw = await api.post<unknown>(`/catalog/extras`, {
        supplierId: input.supplierId,
        title: input.title,
        description: input.description,
        serviceIds: input.serviceIds,
      });
      return normalizeCatalogExtraListItem(raw);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["catalog-extras", "supplier", variables.supplierId],
      });
    },
  });
}
