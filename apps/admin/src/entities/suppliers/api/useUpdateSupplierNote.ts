import {
  ApiError,
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type { SupplierNoteDto } from "../model/note-types";

import { supplierNoteQueryKey } from "./useSupplierNote";

export type UpdateSupplierNoteVariables = {
  supplierId: string;
  text: string;
  version: number;
};

/**
 * PUT /catalog/suppliers/{supplierId}/note
 */
export function useUpdateSupplierNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      text,
      version,
    }: UpdateSupplierNoteVariables): Promise<SupplierNoteDto> => {
      return api.put<SupplierNoteDto>(`/catalog/suppliers/${supplierId}/note`, {
        supplierId,
        text: text.length === 0 ? null : text,
        version,
      });
    },
    onSuccess: (data, { supplierId }) => {
      queryClient.setQueryData<SupplierNoteDto | null>(
        supplierNoteQueryKey(supplierId),
        data
      );
      toast.success(i18n.t("admin:modals.supplierNotesSavedSuccess"));
    },
    onError: (err, { supplierId }) => {
      if (ApiError.isApiError(err) && err.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: supplierNoteQueryKey(supplierId),
        });
        toast.error(i18n.t("admin:errors.supplierNotesConflict"));
        return;
      }
      toast.error(
        getErrorMessage(err, i18n.t("admin:errors.failedToSaveSupplierNotes"))
      );
    },
  });
}
