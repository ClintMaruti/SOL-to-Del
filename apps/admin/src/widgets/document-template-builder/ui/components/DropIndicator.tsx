import { CircleOff } from "lucide-react";

type DropIndicatorProps = {
  accent?: boolean;
  variant?: "valid" | "invalid";
};

export function DropIndicator({
  accent: _accent = false,
  variant = "valid",
}: DropIndicatorProps) {
  if (variant === "invalid") {
    return (
      <div className="w-full px-1 py-1">
        <div className="flex items-center gap-2 rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-2 py-1 text-destructive">
          <CircleOff className="size-4 shrink-0" />
          <div className="h-0.5 flex-1 rounded-full bg-destructive/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-1 py-0.5">
      <div className="h-0.5 w-full rounded-full bg-blue-500" />
    </div>
  );
}
