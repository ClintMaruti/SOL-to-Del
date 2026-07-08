import { useDraggable } from "@dnd-kit/core";
import { cn } from "@sol/ui";
import { GripVertical } from "lucide-react";

import type { ActiveDragState, BuilderPaletteItem } from "../../model";

import { PALETTE_GRIP_CLASS } from "./constants";

type PaletteItemRowProps = {
  item: BuilderPaletteItem;
};

export function PaletteItemRow({ item }: PaletteItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: {
        type: "palette",
        label: item.label,
        definition: item.definition,
      } satisfies ActiveDragState,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={isDragging ? undefined : style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex min-h-8 cursor-grab items-center justify-between rounded-md border border-border-tertiary bg-background px-3 py-1.5 transition-colors hover:border-brand-red/30 hover:bg-background-secondary/40",
        isDragging && "opacity-45"
      )}
    >
      <span className="text-sm font-medium leading-6 text-text-primary">
        {item.label}
      </span>
      <GripVertical className={cn("size-4", PALETTE_GRIP_CLASS)} />
    </div>
  );
}
