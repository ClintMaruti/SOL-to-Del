import type { DocumentTemplateContentItem } from "@/entities/document-template";
import {
  getDocumentTemplateItemLabel,
  getDocumentTemplateItemPreview,
} from "@/entities/document-template";

import type { ContentBlocksById } from "../../model";

import { CanvasRow } from "./CanvasRow";
import { SortableItemCard } from "./SortableItemCard";

type SortableContentRowProps = {
  id: string;
  item: DocumentTemplateContentItem;
  contentBlocksById: ContentBlocksById;
  categoryLabel: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  accent?: boolean;
};

export function SortableContentRow({
  id,
  item,
  contentBlocksById,
  categoryLabel,
  collapsed,
  onToggleCollapsed,
  onRemove,
  accent,
}: SortableContentRowProps) {
  return (
    <SortableItemCard id={id}>
      {({ dragHandleProps }) => {
        const preview = getDocumentTemplateItemPreview(item, contentBlocksById);

        return (
          <CanvasRow
            dragHandleProps={dragHandleProps}
            categoryLabel={categoryLabel}
            title={getDocumentTemplateItemLabel(item, contentBlocksById)}
            accent={accent}
            collapsed={collapsed}
            onToggleCollapsed={onToggleCollapsed}
            onRemove={onRemove}
            body={
              preview ? (
                <div className="min-w-0 px-6 py-4">
                  <p className="truncate text-sm font-medium leading-6 text-text-tertiary">
                    {preview}
                  </p>
                </div>
              ) : undefined
            }
          />
        );
      }}
    </SortableItemCard>
  );
}
