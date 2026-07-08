import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  RichTextEditor,
  type RichTextEditorLabels,
  Skeleton,
} from "@sol/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import {
  useContentBlock,
  useCreateContentBlock,
  useUpdateContentBlock,
} from "@/entities/content-block";
import type { ContentBlockDetail } from "@/entities/content-block/model/types";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";

const EMPTY_BODY = "<p></p>";

function ContentBlockDetailForm({
  isCreate,
  initial,
}: {
  isCreate: boolean;
  initial: ContentBlockDetail | null;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation(["admin", "common"]);

  const { mutate: createBlock, isPending: isCreating } =
    useCreateContentBlock();
  const { mutate: updateBlock, isPending: isUpdating } =
    useUpdateContentBlock();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(
    initial?.body && initial.body.trim() !== "" ? initial.body : EMPTY_BODY
  );

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

  const handleCancel = () => {
    navigate(ROUTES.DATABASE_CONTENT);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const payloadBody =
      body.trim() === "" || body === EMPTY_BODY ? EMPTY_BODY : body;

    if (isCreate) {
      createBlock(
        { title: trimmedTitle, body: payloadBody },
        {
          onSuccess: () => {
            navigate(ROUTES.DATABASE_CONTENT);
          },
        }
      );
      return;
    }

    if (!initial) {
      return;
    }

    updateBlock({
      id: initial.id,
      title: trimmedTitle,
      body: payloadBody,
      version: initial.version,
    });
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-4">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="leading-10 text-text-primary font-bold text-2xl">
            {isCreate
              ? t("admin:contentBlocks.newTitle")
              : (initial?.title ?? "")}
          </h1>
          {isCreate ? (
            <p className="w-full max-w-full leading-6 text-text-secondary text-sm font-medium">
              {t("admin:contentBlocks.createSubtitle")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!title.trim()}
          >
            {t("common:buttons.save")}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Card className="w-full min-h-[88px] shrink-0 rounded-[var(--radius-md)] border-0 bg-white shadow-none">
          <CardContent className="flex flex-col gap-2 p-0 pt-3 pr-4 pb-3 pl-4">
            <Label htmlFor="content-block-title">
              {t("admin:contentBlocks.form.titleLabel")}
            </Label>
            <Input
              id="content-block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("admin:contentBlocks.form.titlePlaceholder")}
              disabled={isSaving}
              className="w-full max-w-full"
            />
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-1 flex-col">
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder={t("admin:contentBlocks.form.bodyPlaceholder")}
            disabled={isSaving}
            labels={editorLabels}
            className="min-h-0 flex-1"
          />
        </div>
      </div>
    </div>
  );
}

export function ContentBlockDetailPage() {
  const { contentBlockId } = useParams<{ contentBlockId: string }>();
  const isCreate = !contentBlockId;
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  const {
    data: block,
    isLoading,
    error,
  } = useContentBlock(isCreate ? undefined : contentBlockId);

  const pageShellClass =
    "flex h-[calc(100vh-var(--layout-reserved-footer-height,0px)-4rem)] min-h-0 flex-col overflow-hidden";

  if (!isCreate && isLoading) {
    return (
      <div className={`${pageShellClass} p-4`}>
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
          <Skeleton className="h-9 w-64 shrink-0" />
          <Skeleton className="h-4 w-full max-w-xl shrink-0" />
          <Skeleton className="h-10 w-full shrink-0" />
          <Skeleton className="min-h-0 w-full flex-1 rounded-md" />
        </div>
      </div>
    );
  }

  if (!isCreate && (error || !block)) {
    return (
      <div
        className={`flex min-h-[calc(100vh-var(--layout-reserved-footer-height,0px)-4rem)] flex-col px-6 py-6`}
      >
        <ResourceNotFound
          title={t("notFound.contentBlock")}
          description={t("notFound.contentBlockDescription")}
          actionLabel={t("buttons.backToContent")}
          onAction={() => navigate(ROUTES.DATABASE_CONTENT)}
        />
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      <ContentBlockDetailForm
        key={isCreate ? "create" : `${block!.id}-${block!.version}`}
        isCreate={isCreate}
        initial={isCreate ? null : block!}
      />
    </div>
  );
}
