import { FileX } from "lucide-react";
import type { ReactNode } from "react";

interface ServiceRatesEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function ServiceRatesEmptyState({
  title,
  description,
  action,
}: ServiceRatesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-border-tertiary bg-white py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-sky-100">
        <FileX className="h-6 w-6 text-sky-600" aria-hidden />
      </div>
      <p className="text-base font-bold text-foreground">{title}</p>
      <p className="max-w-md text-sm font-medium text-secondary-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}
