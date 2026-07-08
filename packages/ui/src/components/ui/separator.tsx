import * as React from "react";
import { cn } from "../../lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  text?: string;
}

function Separator({
  className,
  orientation = "horizontal",
  text,
  ...props
}: SeparatorProps) {
  if (text && orientation === "horizontal") {
    return (
      <div
        className={cn("flex items-center gap-3 w-full", className)}
        {...props}
      >
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">{text}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
