import {
  api,
  ApiError,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import {
  mapDetailFromApi,
  type SupplierContentBlockDetail,
  type SupplierContentBlockDetailApi,
  type SupplierContentBlockListItem,
  type UpdateSupplierContentBlockPayload,
} from "../model/types";

export function useUpdateSupplierContentBlock(supplierId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateSupplierContentBlockPayload
    ): Promise<SupplierContentBlockDetail> => {
      if (!supplierId) {
        throw new Error("supplierId is required");
      }
      const { contentBlockId, body, version } = payload;
      const data = await api.put<SupplierContentBlockDetailApi>(
        `/catalog/supplier-content-blocks/${contentBlockId}`,
        { body, version }
      );
      return mapDetailFromApi(data);
    },
    onSuccess: (data) => {
      toast.success(
        i18n.t("modals.supplierContentBlockUpdatedSuccess", { ns: "admin" })
      );
      queryClient.setQueryData<SupplierContentBlockDetail>(
        ["supplier-content-block", supplierId, data.id],
        data
      );
      queryClient.setQueryData<SupplierContentBlockListItem[]>(
        ["supplier-content-blocks", supplierId],
        (previous) => {
          if (!Array.isArray(previous)) {
            return previous;
          }
          return previous.map((row) =>
            row.id === data.id
              ? {
                  ...row,
                  bodyPreview: data.body,
                  version: data.version,
                  updatedAt: data.updatedAt,
                  updatedBy: data.updatedBy,
                }
              : row
          );
        }
      );
    },
    onError: (error) => {
      if (ApiError.isApiError(error) && error.status === 409) {
        return;
      }
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateSupplierContentBlock", { ns: "admin" })
        )
      );
    },
  });
}
