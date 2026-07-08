import { useSortable } from "@dnd-kit/sortable";
import { cn } from "@sol/ui";
import type { ReactNode } from "react";

import type { SortableHandleProps, SortableItemData } from "../../model";

type SortableCardRenderArgs = {
  dragHandleProps: SortableHandleProps;
  isDragging: boolean;
};

type SortableItemCardProps = {
  id: string;
  children: (args: SortableCardRenderArgs) => ReactNode;
  className?: string;
};

export function SortableItemCard({
  id,
  children,
  className,
}: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "item",
      itemId: id,
    } satisfies SortableItemData,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && "opacity-0")}
    >
      {children({
        dragHandleProps: {
          attributes,
          listeners,
          setActivatorNodeRef,
        },
        isDragging,
      })}
    </div>
  );
}
