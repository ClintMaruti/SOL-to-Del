import {
  api,
  getErrorMessage,
  useMutation,
  useQueryClient,
} from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";

import type {
  ContentBlockDetail,
  UpdateContentBlockPayload,
} from "../model/types";

export function useUpdateContentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateContentBlockPayload
    ): Promise<ContentBlockDetail> => {
      const { id, title, body, version } = payload;
      return api.put<ContentBlockDetail>(`/catalog/content-blocks/${id}`, {
        id,
        title,
        body,
        version,
      });
    },
    onSuccess: (data) => {
      toast.success(
        i18n.t("modals.contentBlockUpdatedSuccess", { ns: "admin" })
      );
      queryClient.setQueryData<ContentBlockDetail>(
        ["content-block", data.id],
        data
      );
      queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToUpdateContentBlock", { ns: "admin" })
        )
      );
    },
  });
}
