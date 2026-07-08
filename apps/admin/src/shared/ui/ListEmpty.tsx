import { Button, Card, CardContent } from "@sol/ui";
import { Package, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ListEmptyProps {
  /** Main heading (e.g. "No suppliers yet") */
  title: string;
  /** Supporting text below the title */
  description?: React.ReactNode;
  /** Optional icon - defaults to Package in a light sky box */
  icon?: React.ReactNode;
  /** Label for the primary action button (e.g. "Create") */
  actionLabel?: string;
  /** Called when the user clicks the action button. When provided with actionLabel, shows the button. */
  onAction?: () => void;
  className?: string;
  hideButtonIcon?: boolean;
}

/**
 * Empty state for table/list views when there are no items yet.
 * Matches the pattern used by ResourceNotFound: icon, title, description,
 * and optional primary action (e.g. Create). Use when a list has zero items.
 */
export function ListEmpty({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
  hideButtonIcon = false,
}: ListEmptyProps) {
  const { t } = useTranslation("common");
  const defaultIcon = (
    <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100">
      <Package className="h-6 w-6 text-sky-600" />
    </div>
  );

  const effectiveActionLabel = actionLabel ?? t("buttons.create");
  const showAction = onAction != null && effectiveActionLabel;

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="mb-6">{icon ?? defaultIcon}</div>
        <h3
          className={`text-lg font-bold text-foreground leading-8 ${
            description ? "mb-2" : showAction ? "mb-6" : ""
          }`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground font-medium leading-6 max-w-md mb-6">
            {description}
          </p>
        )}
        {showAction && (
          <Button variant="primary" onClick={onAction}>
            {!hideButtonIcon && <Plus className="size-4" />}
            {effectiveActionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
