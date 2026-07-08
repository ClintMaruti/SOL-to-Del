import { api, useQuery } from "@sol/api-client";

import type { ContentBlockDetail } from "../model/types";

export function useContentBlock(contentBlockId: string | undefined) {
  return useQuery<ContentBlockDetail>({
    queryKey: ["content-block", contentBlockId],
    queryFn: async () => {
      if (!contentBlockId) {
        throw new Error("contentBlockId is required");
      }
      return api.get<ContentBlockDetail>(
        `/catalog/content-blocks/${contentBlockId}`
      );
    },
    enabled: Boolean(contentBlockId),
  });
}
