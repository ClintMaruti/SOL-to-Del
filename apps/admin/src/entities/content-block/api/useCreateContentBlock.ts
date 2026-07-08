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
  CreateContentBlockPayload,
} from "../model/types";

export function useCreateContentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateContentBlockPayload
    ): Promise<ContentBlockDetail> => {
      return api.post<ContentBlockDetail>("/catalog/content-blocks", payload);
    },
    onSuccess: (data) => {
      toast.success(
        i18n.t("modals.contentBlockCreatedSuccess", { ns: "admin" })
      );

      queryClient.setQueryData<ContentBlockDetail>(
        ["content-block", data.id],
        data
      );

      void queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          i18n.t("errors.failedToCreateContentBlock", { ns: "admin" })
        )
      );
    },
  });
}
