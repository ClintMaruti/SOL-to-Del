import { Button } from "@sol/ui";
import { X } from "lucide-react";

type RowActionsProps = {
  onRemove: () => void;
};

export function RowActions({ onRemove }: RowActionsProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRemove}
      className="size-5 rounded-sm p-0 text-text-secondary hover:bg-background-secondary hover:text-text-primary"
    >
      <X className="size-4" />
    </Button>
  );
}
