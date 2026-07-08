import { api, useQuery } from "@sol/api-client";

import {
  mapListItemFromApi,
  type ContentBlockListItem,
  type ContentBlockListItemApi,
} from "../model/types";

export function useContentBlocks() {
  return useQuery<ContentBlockListItem[]>({
    queryKey: ["content-blocks"],
    queryFn: async () => {
      const data = await api.get<ContentBlockListItemApi[]>(
        "/catalog/content-blocks"
      );
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(mapListItemFromApi);
    },
  });
}
