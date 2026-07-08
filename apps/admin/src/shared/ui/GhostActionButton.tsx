import { Button } from "@sol/ui";
import { Plus } from "lucide-react";

interface GhostActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function GhostActionButton({
  onClick,
  icon = <Plus className="size-4" />,
  children,
}: GhostActionButtonProps) {
  return (
    <Button type="button" variant="tertiary" size="sm" onClick={onClick}>
      {icon}
      {children}
    </Button>
  );
}
