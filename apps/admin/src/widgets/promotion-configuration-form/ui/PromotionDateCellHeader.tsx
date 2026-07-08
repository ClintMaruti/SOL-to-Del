import { cn } from "@sol/ui";

interface PromotionDateCellHeaderProps {
  label: string;
  required?: boolean;
  className?: string;
}

export function PromotionDateCellHeader({
  label,
  required = false,
  className,
}: PromotionDateCellHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center bg-background-disabled px-4 py-1.5",
        className
      )}
    >
      <p className="text-sm font-semibold leading-6 text-text-primary">
        {label}
        {required ? <span className="text-[#f54a00]">*</span> : null}
      </p>
    </div>
  );
}
