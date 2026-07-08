import { DragOverlay, type DropAnimation } from "@dnd-kit/core";
import { CircleOff, GripVertical } from "lucide-react";

import type { ActiveDragState } from "../model";

type DocumentTemplateDragOverlayProps = {
  activeDrag: ActiveDragState | null;
  dropAnimation?: DropAnimation | null;
  isDropInvalid?: boolean;
};

export function DocumentTemplateDragOverlay({
  activeDrag,
  dropAnimation,
  isDropInvalid = false,
}: DocumentTemplateDragOverlayProps) {
  return (
    <DragOverlay dropAnimation={dropAnimation}>
      {activeDrag ? (
        <div className="flex items-center gap-2 rounded-md border border-border-tertiary bg-background px-3 py-2 shadow-lg">
          {isDropInvalid ? (
            <CircleOff className="size-4 text-destructive" />
          ) : (
            <GripVertical className="size-4 text-text-tertiary" />
          )}
          <span className="text-sm font-semibold leading-5 text-text-primary">
            {activeDrag.label}
          </span>
        </div>
      ) : null}
    </DragOverlay>
  );
}
