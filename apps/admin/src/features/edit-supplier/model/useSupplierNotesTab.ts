import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupplierNote, useUpdateSupplierNote } from "@/entities/suppliers";

export type UseSupplierNotesTabResult = {
  /** Draft text in the notes field */
  text: string;
  setText: (value: string) => void;
  isLoading: boolean;
  isFetched: boolean;
  loadError: boolean;
  isDirty: boolean;
  resetToSaved: () => void;
  handleSave: (e: React.FormEvent) => void;
  isPending: boolean;
  formId: string;
};

const NOTES_FORM_ID = "supplier-notes-form";

export function useSupplierNotesTab(
  supplierId: string | undefined
): UseSupplierNotesTabResult {
  const {
    data: note,
    isPending: isLoading,
    isFetched,
    isError,
  } = useSupplierNote(supplierId);

  const { mutate, isPending } = useUpdateSupplierNote();

  const [text, setText] = useState("");

  const savedText = useMemo(() => {
    if (!isFetched || isError) return null;
    return note?.text ?? "";
  }, [isFetched, isError, note]);

  useEffect(() => {
    if (!supplierId || savedText === null) return;
    setText(savedText);
  }, [supplierId, savedText, note?.id, note?.version]);

  const isDirty = useMemo(
    () => savedText !== null && text !== savedText,
    [savedText, text]
  );

  const resetToSaved = useCallback(() => {
    if (savedText === null) return;
    setText(savedText);
  }, [savedText]);

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!supplierId || isError) return;
      const version = note?.version ?? 0;
      mutate({ supplierId, text, version });
    },
    [supplierId, text, note?.version, mutate, isError]
  );

  return {
    text,
    setText,
    isLoading,
    isFetched,
    loadError: isError,
    isDirty,
    resetToSaved,
    handleSave,
    isPending,
    formId: NOTES_FORM_ID,
  };
}
