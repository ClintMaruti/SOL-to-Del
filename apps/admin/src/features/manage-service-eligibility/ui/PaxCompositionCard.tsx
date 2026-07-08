import { Button, Separator } from "@sol/ui";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  AgeRestriction,
  PaxCompositionGroup,
  PaxTypeConstraint,
} from "@/entities/service-eligibility";

import { CompositionGroup } from "./CompositionGroup";

interface PaxCompositionCardProps {
  compositionGroups: PaxCompositionGroup[];
  saveAttempted?: boolean;
  disabled?: boolean;
  onAddCompositionGroup: () => void;
  onRemoveCompositionGroup: (groupId: string) => void;
  onAddPaxTypeConstraint: (groupId: string) => void;
  onUpdatePaxTypeConstraint: (
    groupId: string,
    constraintId: string,
    updates: Partial<
      Pick<PaxTypeConstraint, "paxType" | "paxCode" | "minCount" | "maxCount">
    >
  ) => void;
  onAddAgeRestriction: (groupId: string, constraintId: string) => void;
  onRemoveAgeRestriction: (groupId: string, constraintId: string) => void;
  onUpdateAgeRestriction: (
    groupId: string,
    constraintId: string,
    updates: Partial<Pick<AgeRestriction, "ageMin" | "ageMax" | "ruleMode">>
  ) => void;
}

export function PaxCompositionCard({
  compositionGroups,
  saveAttempted,
  disabled,
  onAddCompositionGroup,
  onRemoveCompositionGroup,
  onAddPaxTypeConstraint,
  onUpdatePaxTypeConstraint,
  onAddAgeRestriction,
  onRemoveAgeRestriction,
  onUpdateAgeRestriction,
}: PaxCompositionCardProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex min-w-[min(100%,28rem)] flex-[999_1_32rem] flex-col gap-4 rounded-[6px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">
          {t("sections.paxComposition")}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCompositionGroup}
          disabled={disabled}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("buttons.addPaxComposition")}
        </Button>
      </div>

      {compositionGroups.length > 0 && <Separator />}

      {compositionGroups.map((group, index) => (
        <div key={group.id} className="flex flex-col gap-4">
          <CompositionGroup
            group={group}
            saveAttempted={saveAttempted}
            disabled={disabled}
            onRemove={() => onRemoveCompositionGroup(group.id)}
            onAddPaxTypeConstraint={() => onAddPaxTypeConstraint(group.id)}
            onUpdatePaxTypeConstraint={(constraintId, updates) =>
              onUpdatePaxTypeConstraint(group.id, constraintId, updates)
            }
            onAddAgeRestriction={(constraintId) =>
              onAddAgeRestriction(group.id, constraintId)
            }
            onRemoveAgeRestriction={(constraintId) =>
              onRemoveAgeRestriction(group.id, constraintId)
            }
            onUpdateAgeRestriction={(constraintId, updates) =>
              onUpdateAgeRestriction(group.id, constraintId, updates)
            }
          />
          {index < compositionGroups.length - 1 && (
            <div className="relative flex items-center justify-center py-2">
              <Separator className="absolute left-0 right-0" />
              <span className="relative z-10 rounded-[6px] border border-border bg-muted px-3 py-0.5 text-sm font-medium text-muted-foreground">
                OR
              </span>
            </div>
          )}
        </div>
      ))}

      {compositionGroups.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddCompositionGroup}
              disabled={disabled}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("buttons.addPaxComposition")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
