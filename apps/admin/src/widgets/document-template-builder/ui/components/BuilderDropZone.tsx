import { useDroppable } from "@dnd-kit/core";
import { cn } from "@sol/ui";
import type { ReactNode } from "react";

import type { DocumentTemplateContainerId } from "@/entities/document-template";

type BuilderDropZoneProps = {
  id: DocumentTemplateContainerId;
  children: ReactNode;
  className?: string;
  overClassName?: string;
};

export function BuilderDropZone({
  id,
  children,
  className,
  overClassName,
}: BuilderDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={cn(className, isOver && overClassName)}>
      {children}
    </div>
  );
}
