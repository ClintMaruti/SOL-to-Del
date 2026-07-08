import { api, useQuery } from "@sol/api-client";

import { mapDocumentTemplateDetailFromApi } from "../model/mappers";
import type {
  DocumentTemplateDetail,
  DocumentTemplateDetailApi,
} from "../model/types";

export function useDocumentTemplate(documentTemplateId: string | undefined) {
  return useQuery<DocumentTemplateDetail>({
    queryKey: ["document-template", documentTemplateId],
    queryFn: async () => {
      if (!documentTemplateId) {
        throw new Error("documentTemplateId is required");
      }

      const data = await api.get<DocumentTemplateDetailApi>(
        `/catalog/document-templates/${documentTemplateId}`
      );

      return mapDocumentTemplateDetailFromApi(data);
    },
    enabled: Boolean(documentTemplateId),
  });
}
