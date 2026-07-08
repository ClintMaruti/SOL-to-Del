import { ApiError } from "@sol/api-client";
import {
  Alert,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  RichTextEditor,
  type RichTextEditorLabels,
  Skeleton,
} from "@sol/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useBlocker } from "react-router-dom";

import { useSupplierContentEditor } from "@/features/edit-supplier-content-block/model/useSupplierContentEditor";
import { ROUTES, buildPath, supplierDetailPath } from "@/shared/lib/paths";
import { UnsavedChangesDialog } from "@/shared/ui";

export type SupplierContentBlockEditFormProps = {
  supplierId: string;
  supplierName: string;
  contentBlockId: string;
  /** Navigate away after Cancel or successful Save. */
  onExit: () => void;
};

export function SupplierContentBlockEditForm({
  supplierId,
  supplierName,
  contentBlockId,
  onExit,
}: SupplierContentBlockEditFormProps) {
  const { t } = useTranslation(["admin", "common"]);
  const editor = useSupplierContentEditor({
    supplierId,
    fixedContentBlockId: contentBlockId,
  });
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  /** After a successful save we navigate away; skip blocker (isDirty can lag one frame vs query cache). */
  const bypassUnsavedBlockRef = useRef(false);

  useEffect(() => {
    bypassUnsavedBlockRef.current = false;
  }, [contentBlockId]);

  const shouldBlock = useCallback(
    () => editor.isDirty && !bypassUnsavedBlockRef.current,
    [editor.isDirty]
  );
  const blocker = useBlocker(shouldBlock);

  /* eslint-disable react-hooks/set-state-in-effect -- open dialog when router blocks navigation */
  useEffect(() => {
    if (blocker.state === "blocked") {
      setUnsavedDialogOpen(true);
    }
  }, [blocker.state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const editorLabels: Partial<RichTextEditorLabels> = useMemo(
    () => ({
      headingSelect: t("admin:contentBlocks.editor.headingSelect"),
      paragraph: t("admin:contentBlocks.editor.paragraph"),
      heading1: t("admin:contentBlocks.editor.heading1"),
      heading2: t("admin:contentBlocks.editor.heading2"),
      heading3: t("admin:contentBlocks.editor.heading3"),
      bold: t("admin:contentBlocks.editor.bold"),
      italic: t("admin:contentBlocks.editor.italic"),
      underline: t("admin:contentBlocks.editor.underline"),
      alignLeft: t("admin:contentBlocks.editor.alignLeft"),
      alignCenter: t("admin:contentBlocks.editor.alignCenter"),
      alignRight: t("admin:contentBlocks.editor.alignRight"),
      alignJustify: t("admin:contentBlocks.editor.alignJustify"),
      bulletList: t("admin:contentBlocks.editor.bulletList"),
      orderedList: t("admin:contentBlocks.editor.orderedList"),
      outdent: t("admin:contentBlocks.editor.outdent"),
      indent: t("admin:contentBlocks.editor.indent"),
      clearFormatting: t("admin:contentBlocks.editor.clearFormatting"),
      help: t("admin:contentBlocks.editor.help"),
      toolbar: t("admin:contentBlocks.editor.toolbar"),
      link: t("admin:contentBlocks.editor.link"),
      linkApply: t("admin:contentBlocks.editor.linkApply"),
      unlink: t("admin:contentBlocks.editor.unlink"),
      linkUrlPlaceholder: t("admin:contentBlocks.editor.linkUrlPlaceholder"),
    }),
    [t]
  );

  const handleStay = useCallback(() => {
    setUnsavedDialogOpen(false);
    setPendingCancel(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  const handleDiscard = useCallback(() => {
    setUnsavedDialogOpen(false);
    setPendingCancel(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    onExit();
  }, [blocker, onExit]);

  const requestCancel = () => {
    if (editor.isDirty) {
      setPendingCancel(true);
      setUnsavedDialogOpen(true);
      return;
    }
    onExit();
  };

  const handleSave = () => {
    const detail = editor.detailQuery.data;
    if (!editor.selectedBlockId || !detail) {
      return;
    }
    const body =
      editor.draftBody.trim() === "" || editor.draftBody === "<p></p>"
        ? "<p></p>"
        : editor.draftBody;

    editor.updateMutation.mutate(
      {
        contentBlockId: editor.selectedBlockId,
        body,
        version: detail.version,
      },
      {
        onSuccess: () => {
          bypassUnsavedBlockRef.current = true;
          onExit();
        },
      }
    );
  };

  const suppliersLink = ROUTES.SUPPLIERS;
  const supplierLink = buildPath(ROUTES.SUPPLIERS_DETAIL, { supplierId });
  const supplierContentTabLink = `${supplierDetailPath(supplierId)}?tab=content`;

  const versionConflict =
    editor.updateMutation.isError &&
    ApiError.isApiError(editor.updateMutation.error) &&
    editor.updateMutation.error.status === 409;

  const detailData = editor.detailQuery.data;
  /** Wait for GET detail + layout-effect draft hydration so TipTap mounts with server HTML. */
  const loadingDetail =
    !editor.detailQuery.isError &&
    (detailData === undefined || !editor.detailDraftReady);
  const detailError = editor.detailQuery.isError;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4">
      <Breadcrumb className="py-1.5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                className="text-blue-500 text-sm font-medium"
                to={suppliersLink}
              >
                {t("admin:sidebar.suppliers")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                className="text-blue-500 text-sm font-medium"
                to={supplierLink}
              >
                {supplierName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                className="text-blue-500 text-sm font-medium"
                to={supplierContentTabLink}
              >
                {t("admin:supplierContent.crumbContent")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-neutral-900 text-sm font-medium">
              {t("admin:supplierContent.crumbEdit")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex shrink-0 items-start justify-between gap-4">
        <h2 className="text-2xl font-bold text-text-primary">
          {loadingDetail ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            editor.selectedTitle
          )}
        </h2>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={requestCancel}
            disabled={editor.updateMutation.isPending}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={editor.updateMutation.isPending}
            disabled={loadingDetail || detailError || !editor.detailQuery.data}
          >
            {t("common:buttons.save")}
          </Button>
        </div>
      </div>

      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {t("admin:supplierContent.detailLoadError")}
          </AlertDescription>
        </Alert>
      ) : null}

      {versionConflict ? (
        <Alert variant="info">
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("admin:supplierContent.versionConflictHint")}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void editor.reloadDetail()}
            >
              {t("admin:supplierContent.reloadLatest")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {loadingDetail ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[320px] w-full rounded-md" />
          </div>
        ) : detailData ? (
          <RichTextEditor
            key={`${contentBlockId}-${detailData.version}`}
            value={editor.draftBody}
            onChange={editor.setDraftBody}
            placeholder={t("admin:contentBlocks.form.bodyPlaceholder")}
            disabled={editor.updateMutation.isPending}
            labels={editorLabels}
            className="min-h-0 flex-1"
          />
        ) : null}
      </div>

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleStay();
          }
        }}
        onStay={handleStay}
        onDiscard={handleDiscard}
        description={
          pendingCancel
            ? t("admin:supplierContent.unsavedCancelDescription")
            : undefined
        }
      />
    </div>
  );
}
