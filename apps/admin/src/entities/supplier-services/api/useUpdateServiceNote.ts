import { api, useMutation, useQueryClient } from "@sol/api-client";

import type { CatalogEntityNote, UpdateServiceNotePayload } from "../types";

interface UpdateServiceNoteParams {
  serviceId: string;
  supplierId: string;
  payload: UpdateServiceNotePayload;
}

export function useUpdateServiceNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      payload,
    }: UpdateServiceNoteParams): Promise<CatalogEntityNote> => {
      return api.put<CatalogEntityNote>(
        `/catalog/services/${serviceId}/note`,
        payload
      );
    },
    onSuccess: (data, { serviceId, supplierId }) => {
      queryClient.setQueryData(["supplier-service-note", serviceId], data);
      queryClient.invalidateQueries({
        queryKey: ["supplier-service-note", serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-service", serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-services", supplierId],
      });
    },
  });
}
