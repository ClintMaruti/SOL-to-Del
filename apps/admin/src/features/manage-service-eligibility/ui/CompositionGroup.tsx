import { Button } from "@sol/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  AgeRestriction,
  PaxCompositionGroup,
  PaxTypeConstraint,
} from "@/entities/service-eligibility";

import { AgeRestrictionRow } from "./AgeRestrictionRow";
import { PaxTypeConstraintField } from "./PaxTypeConstraintField";

interface CompositionGroupProps {
  group: PaxCompositionGroup;
  saveAttempted?: boolean;
  disabled?: boolean;
  onRemove: () => void;
  onAddPaxTypeConstraint: () => void;
  onUpdatePaxTypeConstraint: (
    constraintId: string,
    updates: Partial<
      Pick<PaxTypeConstraint, "paxType" | "paxCode" | "minCount" | "maxCount">
    >
  ) => void;
  onAddAgeRestriction: (constraintId: string) => void;
  onRemoveAgeRestriction: (constraintId: string) => void;
  onUpdateAgeRestriction: (
    constraintId: string,
    updates: Partial<Pick<AgeRestriction, "ageMin" | "ageMax" | "ruleMode">>
  ) => void;
}

export function CompositionGroup({
  group,
  saveAttempted,
  disabled,
  onRemove,
  onAddPaxTypeConstraint,
  onUpdatePaxTypeConstraint,
  onAddAgeRestriction,
  onRemoveAgeRestriction,
  onUpdateAgeRestriction,
}: CompositionGroupProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[6px] bg-gray-100 p-2">
      <div className="flex flex-col gap-2">
        {group.paxTypeConstraints.map((constraint) => (
          <div key={constraint.id} className="flex flex-col gap-2">
            <PaxTypeConstraintField
              constraint={constraint}
              saveAttempted={saveAttempted}
              hasAgeRestriction={!!constraint.ageRestriction}
              disabled={disabled}
              onUpdate={(updates) =>
                onUpdatePaxTypeConstraint(constraint.id, updates)
              }
              onSpecifyAge={() => onAddAgeRestriction(constraint.id)}
            />
            {constraint.ageRestriction && (
              <AgeRestrictionRow
                ageRestriction={constraint.ageRestriction}
                disabled={disabled}
                onUpdate={(updates) =>
                  onUpdateAgeRestriction(constraint.id, updates)
                }
                onRemove={() => onRemoveAgeRestriction(constraint.id)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPaxTypeConstraint}
          className="text-brand-red hover:text-brand-red"
          disabled={disabled}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("buttons.addPaxType")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-brand-red hover:text-brand-red"
          disabled={disabled}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          {t("buttons.remove")}
        </Button>
      </div>
    </div>
  );
}
