import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useContentBlocks } from "@/entities/content-block";
import type { SupplierContentType } from "@/entities/document-template";

import type {
  BuilderPaletteItem,
  ContentBlocksById,
  PaletteGroups,
} from "./types";

export function useDocumentTemplateBuilderResources() {
  const { t } = useTranslation(["admin"]);
  const {
    data: contentBlocks = [],
    isLoading: isLoadingContentBlocks,
    error: contentBlocksError,
  } = useContentBlocks();

  const editorLabels = useMemo(
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
    }),
    [t]
  );

  const contentBlocksById = useMemo(
    () =>
      contentBlocks.reduce<ContentBlocksById>((acc, block) => {
        acc[block.id] = { title: block.title, body: block.body };
        return acc;
      }, {}),
    [contentBlocks]
  );

  const paletteItems = useMemo<BuilderPaletteItem[]>(
    () => [
      {
        id: "palette:page-divider",
        label: t("documentTemplates.builder.pageDivider"),
        category: "general",
        definition: { kind: "PageDivider" },
      },
      {
        id: "palette:section",
        label: t("documentTemplates.builder.section"),
        category: "general",
        definition: { kind: "Section" },
      },
      ...contentBlocks.map((block) => ({
        id: `palette:global:${block.id}`,
        label: block.title,
        category: "global" as const,
        definition: {
          kind: "Content" as const,
          source: "GLOBAL" as const,
          contentBlockId: block.id,
        },
      })),
      {
        id: "palette:static-text",
        label: t("documentTemplates.builder.staticText"),
        category: "global",
        definition: { kind: "StaticText" },
      },
      ...(
        [
          "About",
          "Terms & Conditions",
          "Overview",
          "Service Notes",
          "Activities",
        ] as SupplierContentType[]
      ).map((supplierContentType) => ({
        id: `palette:supplier:${supplierContentType}`,
        label: supplierContentType,
        category: "suppliers" as const,
        definition: {
          kind: "Content" as const,
          source: "SUPPLIER" as const,
          supplierContentType,
        },
      })),
    ],
    [contentBlocks, t]
  );

  const groupedPaletteItems = useMemo<PaletteGroups>(
    () => ({
      general: paletteItems.filter((item) => item.category === "general"),
      global: paletteItems.filter((item) => item.category === "global"),
      suppliers: paletteItems.filter((item) => item.category === "suppliers"),
    }),
    [paletteItems]
  );

  return {
    contentBlocksById,
    contentBlocksError,
    editorLabels,
    groupedPaletteItems,
    isLoadingContentBlocks,
  };
}
