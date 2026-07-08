import { Button } from "@sol/ui";
import { GripVertical } from "lucide-react";

import type { SortableHandleProps } from "../../model";

type DragHandleProps = {
  dragHandleProps: SortableHandleProps;
};

export function DragHandle({ dragHandleProps }: DragHandleProps) {
  return (
    <Button
      ref={dragHandleProps.setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-5 rounded-sm p-0 text-text-tertiary hover:bg-background-secondary hover:text-text-secondary"
      {...dragHandleProps.attributes}
      {...dragHandleProps.listeners}
    >
      <GripVertical className="size-4" />
    </Button>
  );
}
