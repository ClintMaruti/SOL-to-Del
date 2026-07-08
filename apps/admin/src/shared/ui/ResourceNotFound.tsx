import { Button, Card, CardContent } from "@sol/ui";
import { FileX } from "lucide-react";

export interface ResourceNotFoundProps {
  /** Main heading (e.g. "Agency not found") */
  title: string;
  /** Supporting text below the title */
  description?: React.ReactNode;
  /** Label for the primary action button */
  actionLabel: string;
  /** Called when the user clicks the action button */
  onAction: () => void;
  /** Optional icon - defaults to FileX in a light blue box with not-found styling */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Empty/not-found state matching the Figma design: icon, title, description,
 * and a primary action button. Use when a requested resource (e.g. agency)
 * does not exist.
 */
export function ResourceNotFound({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: ResourceNotFoundProps) {
  const defaultIcon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <FileX className="h-6 w-6 text-blue-600" />
    </div>
  );

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="mb-6">{icon ?? defaultIcon}</div>
        <h2
          className={`text-lg font-bold text-foreground leading-8 ${
            description ? "mb-2" : "mb-6"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground font-medium leading-6 max-w-md mb-6">
            {description}
          </p>
        )}
        <Button onClick={onAction}>{actionLabel}</Button>
      </CardContent>
    </Card>
  );
}
