import { Badge, Button, cn } from "@sol/ui";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  formatCoordinates,
  getDestinationTypeConfig,
} from "@/entities/destination/lib/destination-utils";
import type { Destination } from "@/entities/destination/model/types";
import { useHighlightMatch } from "@/shared/hooks";

interface DestinationTreeRowProps {
  destination: Destination;
  depth: number;
  /** Visual hint for preferred country rows (primary) and their descendants (cascade). */
  preferredStar?: "primary" | "cascade" | "none";
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: (destination: Destination) => void;
  onEdit?: (destination: Destination) => void;
  onAdd?: (destination: Destination) => void;
  searchQuery?: string;
}

export function DestinationTreeRow({
  destination,
  depth,
  preferredStar = "none",
  isExpanded,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
  searchQuery,
}: DestinationTreeRowProps) {
  const { t } = useTranslation("admin");
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = getDestinationTypeConfig(destination.type);
  const Icon = typeConfig.icon;
  const hasChildren = destination.children && destination.children.length > 0;
  const indentLevel = depth * 24; // 24px per level

  const isNotInUse = destination.status === "Inactive";
  const showActions = isHovered && !isNotInUse && (onDelete || onEdit || onAdd);
  const showCoordinates = !isNotInUse && !showActions;

  const destinationName = useHighlightMatch(destination.name, searchQuery);

  const preferredStarNode =
    preferredStar === "none" ? null : (
      <Star
        className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500"
        aria-hidden={preferredStar === "cascade"}
        aria-label={
          preferredStar === "primary"
            ? t("aria.preferredDestinationStar", { name: destination.name })
            : undefined
        }
      />
    );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(destination);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(destination);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.(destination);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-center border-b border-border py-3 px-4 transition-colors w-full min-w-0 relative group h-[52px] gap-3",
        hasChildren && "hover:bg-accent/50",
        isNotInUse && "bg-muted/50"
      )}
    >
      {/* Name cell: expand + type + label (star sits in fixed column next to code) */}
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-transparent cursor-pointer -my-3 -ml-4 pl-4 pr-1 py-3"
          style={{ paddingLeft: `${indentLevel + 16}px` }}
          aria-label={isExpanded ? t("aria.collapse") : t("aria.expand")}
          type="button"
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isNotInUse ? "text-muted-foreground opacity-60" : typeConfig.color
            )}
          />
          <span
            className={cn(
              "text-base truncate min-w-0 flex-1 text-left",
              isNotInUse ? "text-muted-foreground" : "text-text-primary"
            )}
          >
            {destinationName}
          </span>
        </button>
      ) : (
        <div
          className="flex items-center gap-2 flex-1 min-w-0 pr-1"
          style={{ paddingLeft: `${indentLevel}px` }}
        >
          <div className="w-5 shrink-0" />
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isNotInUse ? "text-muted-foreground opacity-60" : typeConfig.color
            )}
          />
          <span
            className={cn(
              "text-base truncate min-w-0 flex-1",
              isNotInUse ? "text-muted-foreground" : "text-text-primary"
            )}
          >
            {destinationName}
          </span>
        </div>
      )}

      {/* Fixed-width star column + code (aligned across rows; code width does not shift stars) */}
      <div className="flex items-center shrink-0 gap-8 relative z-10">
        <div className="w-5 shrink-0 flex items-center justify-center">
          {preferredStarNode}
        </div>
        <div className="min-w-[4.25rem] flex items-center justify-start tabular-nums">
          {destination.code ? (
            <Badge
              variant="outline"
              className={cn(
                "text-sm bg-muted border-border whitespace-nowrap rounded-sm p-1",
                isNotInUse ? "text-muted-foreground" : "text-text-secondary"
              )}
            >
              {destination.code}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm w-12">-</span>
          )}
        </div>
      </div>

      {/* Right section: Action buttons / Coordinates / Status */}
      <div className="flex items-center gap-2 shrink-0 min-w-[120px] justify-end relative z-10 ml-auto">
        {showActions ? (
          <div className="flex items-center gap-1.5 animate-in fade-in-0 duration-200">
            {onEdit && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleEdit}
                className="h-8 w-8 border-border bg-background hover:bg-accent"
                aria-label={t("aria.editDestination", {
                  name: destination.name,
                })}
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleDelete}
                className="h-8 w-8 border-border bg-background hover:bg-accent"
                aria-label={t("aria.deleteDestination", {
                  name: destination.name,
                })}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onAdd && destination.type !== "Airport" && (
              <Button
                variant="primary"
                size="icon-sm"
                onClick={handleAdd}
                aria-label={t("aria.addToDestination", {
                  name: destination.name,
                })}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : showCoordinates ? (
          <span
            className={cn(
              "text-text-secondary text-sm whitespace-nowrap transition-opacity duration-200",
              isHovered && "opacity-0"
            )}
          >
            {destination.coordinates
              ? formatCoordinates(destination.coordinates)
              : "-"}
          </span>
        ) : isNotInUse ? (
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {t("status.notInUse")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
