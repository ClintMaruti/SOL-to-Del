import { Button } from "@sol/ui";

interface PromotionRulesTextActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function PromotionRulesTextActionButton({
  children,
  onClick,
}: PromotionRulesTextActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 gap-1 rounded-[6px] px-3 text-xs font-medium leading-5 text-brand-red hover:bg-transparent hover:text-brand-red"
    >
      {children}
    </Button>
  );
}
