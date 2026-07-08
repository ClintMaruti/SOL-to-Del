import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { useTranslation } from "@sol/i18n";
import { toast } from "@sol/ui";

import { serializeDocumentTemplateItems } from "../model/builder";
import { mapDocumentTemplateDetailFromApi } from "../model/mappers";
import type {
  DocumentTemplateDetail,
  DocumentTemplateDetailApi,
  UpdateDocumentTemplatePayload,
} from "../model/types";

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin");

  return useMutation({
    mutationFn: async (
      payload: UpdateDocumentTemplatePayload
    ): Promise<DocumentTemplateDetail> => {
      const { id, title, version, items } = payload;

      const data = await api.put<DocumentTemplateDetailApi>(
        `/catalog/document-templates/${id}`,
        {
          title,
          version,
          items: serializeDocumentTemplateItems(items, id, version),
        }
      );

      return mapDocumentTemplateDetailFromApi(data);
    },
    onSuccess: (data) => {
      toast.success(t("modals.documentTemplateUpdatedSuccess"));

      queryClient.setQueryData<DocumentTemplateDetail>(
        ["document-template", data.id],
        data
      );
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, t("errors.failedToUpdateDocumentTemplate"))
      );
    },
  });
}
