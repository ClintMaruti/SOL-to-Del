import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  useSupplierContentBlock,
  useSupplierContentBlocks,
  useUpdateSupplierContentBlock,
} from "@/entities/supplier-content-block";

import { normalizeRichTextHtmlForCompare } from "./normalizeRichTextForCompare";

const EMPTY_BODY = "<p></p>";

export function useSupplierContentEditor({
  supplierId,
  fixedContentBlockId,
}: {
  supplierId: string;
  /** When set, the editor is bound to this block (standalone page). */
  fixedContentBlockId?: string;
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const activeBlockId = fixedContentBlockId ?? selectedBlockId;

  const listQuery = useSupplierContentBlocks(supplierId);
  const detailQuery = useSupplierContentBlock(
    supplierId,
    activeBlockId ?? undefined
  );
  const updateMutation = useUpdateSupplierContentBlock(supplierId);
  const { refetch: refetchDetail } = detailQuery;

  const [draftBody, setDraftBody] = useState("");
  /** False until layout effect applies server HTML for the current TanStack detail payload (TipTap must mount with correct `value`). */
  const [detailDraftReady, setDetailDraftReady] = useState(false);
  /** Last applied server payload — includes body so we re-sync when body changes at the same version. */
  const syncedDetailSignatureRef = useRef<string | null>(null);

  /* Sync draft from server before paint. Trust query cache scope — do not compare detail.id to URL. */
  /* eslint-disable react-hooks/set-state-in-effect -- intentional sync from query result */
  useLayoutEffect(() => {
    if (!activeBlockId) {
      setDraftBody(EMPTY_BODY);
      setDetailDraftReady(false);
      syncedDetailSignatureRef.current = null;
      return;
    }

    const detail = detailQuery.data;
    if (!detail) {
      setDetailDraftReady(false);
      return;
    }

    const signature = `${activeBlockId}:${detail.version}:${detail.body}`;
    const shouldApply = syncedDetailSignatureRef.current !== signature;

    if (!shouldApply) {
      setDetailDraftReady(true);
      return;
    }

    setDraftBody(detail.body.trim() === "" ? EMPTY_BODY : detail.body);
    syncedDetailSignatureRef.current = signature;
    setDetailDraftReady(true);
  }, [activeBlockId, detailQuery.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openEditor = useCallback(
    (contentBlockId: string) => {
      if (fixedContentBlockId) {
        return;
      }
      setSelectedBlockId(contentBlockId);
      syncedDetailSignatureRef.current = null;
      setDetailDraftReady(false);
    },
    [fixedContentBlockId]
  );

  const closeEditor = useCallback(() => {
    if (fixedContentBlockId) {
      return;
    }
    setSelectedBlockId(null);
    setDraftBody(EMPTY_BODY);
    syncedDetailSignatureRef.current = null;
    setDetailDraftReady(false);
  }, [fixedContentBlockId]);

  const serverBody = detailQuery.data?.body;
  const isDirty = useMemo(() => {
    if (!activeBlockId || serverBody === undefined) {
      return false;
    }
    return (
      normalizeRichTextHtmlForCompare(draftBody) !==
      normalizeRichTextHtmlForCompare(serverBody)
    );
  }, [activeBlockId, draftBody, serverBody]);

  const selectedTitle = useMemo(() => {
    const fromDetail = detailQuery.data?.title;
    if (fromDetail) {
      return fromDetail;
    }
    const list = listQuery.data;
    if (!Array.isArray(list) || !activeBlockId) {
      return "";
    }
    return list.find((r) => r.id === activeBlockId)?.title ?? "";
  }, [activeBlockId, detailQuery.data?.title, listQuery.data]);

  const reloadDetail = useCallback(async () => {
    if (!activeBlockId) {
      return;
    }
    updateMutation.reset();
    const result = await refetchDetail();
    if (result.data) {
      const d = result.data;
      setDraftBody(d.body.trim() === "" ? EMPTY_BODY : d.body);
      syncedDetailSignatureRef.current = `${activeBlockId}:${d.version}:${d.body}`;
      setDetailDraftReady(true);
    }
  }, [activeBlockId, refetchDetail, updateMutation]);

  return {
    selectedBlockId: activeBlockId,
    openEditor,
    closeEditor,
    reloadDetail,
    listQuery,
    detailQuery,
    draftBody,
    setDraftBody,
    detailDraftReady,
    isDirty,
    selectedTitle,
    updateMutation,
    isEditMode: activeBlockId !== null,
  };
}
