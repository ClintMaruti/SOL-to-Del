import { api, useQuery } from "@sol/api-client";

import { mapDocumentTemplateListItemFromApi } from "../model/mappers";
import type {
  DocumentTemplateListItem,
  DocumentTemplateListItemApi,
} from "../model/types";

export function useDocumentTemplates() {
  return useQuery<DocumentTemplateListItem[]>({
    queryKey: ["document-templates"],
    queryFn: async () => {
      const data = await api.get<DocumentTemplateListItemApi[]>(
        "/catalog/document-templates"
      );

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(mapDocumentTemplateListItemFromApi);
    },
  });
}
