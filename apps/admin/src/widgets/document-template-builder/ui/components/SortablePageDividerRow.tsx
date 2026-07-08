import type { DocumentTemplatePageDividerItem } from "@/entities/document-template";

import { CanvasRow } from "./CanvasRow";
import { SortableItemCard } from "./SortableItemCard";

type SortablePageDividerRowProps = {
  item: DocumentTemplatePageDividerItem;
  onRemove: () => void;
  title: string;
  accent?: boolean;
};

export function SortablePageDividerRow({
  item,
  onRemove,
  title,
  accent = true,
}: SortablePageDividerRowProps) {
  return (
    <SortableItemCard id={item.id}>
      {({ dragHandleProps }) => (
        <CanvasRow
          dragHandleProps={dragHandleProps}
          title={title}
          accent={accent}
          onRemove={onRemove}
        />
      )}
    </SortableItemCard>
  );
}
