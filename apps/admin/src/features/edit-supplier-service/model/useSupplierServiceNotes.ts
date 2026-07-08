import { getErrorMessage, ApiError, useQueryClient } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useMemo, useState } from "react";

import {
  useServiceNote,
  useUpdateServiceNote,
} from "@/entities/supplier-services";

export function useSupplierServiceNotes(
  serviceId: string | null | undefined,
  supplierId: string | null | undefined
) {
  const queryClient = useQueryClient();
  const {
    data: note,
    isLoading,
    isFetching,
    error: queryError,
  } = useServiceNote(serviceId ?? null);

  const { mutate: updateNote, isPending } = useUpdateServiceNote();

  const [text, setText] = useState("");

  useEffect(() => {
    if (!serviceId) {
      setText("");
      return;
    }
    setText("");
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || isLoading) return;
    setText(note?.text ?? "");
  }, [serviceId, isLoading, note?.text, note?.version]);

  const isDirty = useMemo(
    () => text !== (note?.text ?? ""),
    [text, note?.text]
  );

  const resetToServer = () => {
    setText(note?.text ?? "");
  };

  const save = () => {
    if (!serviceId || !supplierId) return;
    updateNote(
      {
        serviceId,
        supplierId,
        payload: {
          text: text.trim() === "" ? null : text,
          version: note?.version ?? null,
        },
      },
      {
        onSuccess: (data) => {
          setText(data.text);
          toast.success(
            i18n.t("modals.supplierServiceNoteUpdatedSuccess", { ns: "admin" })
          );
        },
        onError: (err) => {
          if (ApiError.isApiError(err) && err.status === 409) {
            toast.error(
              i18n.t("errors.noteConcurrencyConflict", { ns: "admin" })
            );
            void queryClient.invalidateQueries({
              queryKey: ["supplier-service-note", serviceId],
            });
            return;
          }
          toast.error(
            getErrorMessage(
              err,
              i18n.t("errors.failedToUpdateSupplierServiceNote", {
                ns: "admin",
              })
            )
          );
        },
      }
    );
  };

  return {
    text,
    setText,
    isDirty,
    isLoading: isLoading || isFetching,
    isPending,
    queryError,
    save,
    resetToServer,
  };
}
