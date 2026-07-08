import { Button, cn } from "@sol/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

import type { SortableHandleProps } from "../../model";

import { RAIL_CLASS } from "./constants";
import { DragHandle } from "./DragHandle";
import { RowActions } from "./RowActions";

type CanvasRowProps = {
  dragHandleProps: SortableHandleProps;
  categoryLabel?: string;
  title: string;
  accent?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onRemove: () => void;
  body?: ReactNode;
  bodyClassName?: string;
};

export function CanvasRow({
  dragHandleProps,
  categoryLabel,
  title,
  accent = false,
  collapsed,
  onToggleCollapsed,
  onRemove,
  body,
  bodyClassName,
}: CanvasRowProps) {
  const hasBody = Boolean(body && !collapsed);

  return (
    <div className="w-full">
      <div className="flex items-stretch">
        {accent ? (
          <div
            className={cn(
              RAIL_CLASS,
              hasBody ? "rounded-tl-md" : "rounded-l-md"
            )}
          />
        ) : null}
        <div
          className={cn(
            "flex w-7 shrink-0 items-center justify-center border-border-tertiary px-1",
            accent
              ? "border-b border-r border-t"
              : cn(
                  "border bg-white",
                  hasBody ? "rounded-tl-md" : "rounded-l-md"
                )
          )}
        >
          <DragHandle dragHandleProps={dragHandleProps} />
        </div>
        <div
          className={cn(
            "flex min-h-[40px] flex-1 items-center justify-between bg-white border-b border-r border-t border-border-tertiary px-3 py-2",
            hasBody ? "rounded-tr-md" : "rounded-r-md"
          )}
        >
          <div className="min-w-0">
            {categoryLabel ? (
              <p className="text-[12px] font-semibold leading-5 text-text-secondary">
                {categoryLabel}
              </p>
            ) : null}
            <div className="flex items-center gap-1">
              <p className="truncate text-[14px] font-bold leading-5 text-text-primary">
                {title}
              </p>
              {onToggleCollapsed ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleCollapsed}
                  className="size-5 shrink-0 rounded-sm p-0 text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                >
                  {collapsed ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                </Button>
              ) : null}
            </div>
          </div>
          <RowActions onRemove={onRemove} />
        </div>
      </div>
      {hasBody ? (
        <div className="flex items-stretch">
          {accent ? <div className={cn(RAIL_CLASS, "rounded-bl-md")} /> : null}
          <div
            className={cn(
              "min-w-0 flex-1 border-b border-l border-r border-border-tertiary bg-background-primary",
              accent ? "rounded-br-md" : "rounded-b-md",
              bodyClassName
            )}
          >
            {body}
          </div>
        </div>
      ) : null}
    </div>
  );
}
