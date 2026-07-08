import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@sol/ui";
import { ChevronDown, Copy, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ServiceEligibility } from "@/entities/service-eligibility";

import type {
  ServiceEligibilityItemHandlers,
  ServiceEligibilitySaveHandler,
} from "../model/serviceEligibilitySectionTypes";
import { useEligibilityItem } from "../model/useEligibilityItem";

import { CapacityDurationCard } from "./CapacityDurationCard";
import { EligibilitySaveFooter } from "./EligibilitySaveFooter";
import { PaxCompositionCard } from "./PaxCompositionCard";

interface EligibilityItemProps {
  eligibility: ServiceEligibility;
  defaultOpen?: boolean;
  isNew?: boolean;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: ServiceEligibilitySaveHandler;
  onDirtyChange?: (id: string, isDirty: boolean) => void;
  registerHandlers?: (
    id: string,
    handlers: ServiceEligibilityItemHandlers | null
  ) => void;
  isSaving?: boolean;
}

export function EligibilityItem({
  eligibility,
  defaultOpen = true,
  isNew,
  onDuplicate,
  onDelete,
  onSave,
  onDirtyChange,
  registerHandlers,
  isSaving,
}: EligibilityItemProps) {
  const { t } = useTranslation("admin");

  const {
    form,
    isDirty,
    canSubmit,
    isActive,
    paxCompositionGroups,
    validityDates,
    toggleActive,
    addPaxCompositionGroup,
    removePaxCompositionGroup,
    addPaxTypeConstraint,
    updatePaxTypeConstraint,
    addAgeRestriction,
    removeAgeRestriction,
    updateAgeRestriction,
    addValidityDate,
    removeValidityDate,
    updateValidityDate,
    fieldErrors,
    handleSave,
    isHistorical,
    isOpen,
    saveAttempted,
    setIsOpen,
    setSaveAttempted,
    submitErrors,
  } = useEligibilityItem({
    eligibility,
    defaultOpen,
    isNew,
    onSave,
    onDirtyChange,
    registerHandlers,
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-[6px] border border-border">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 rounded-t-[6px] border-b border-border bg-background px-4 py-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline-secondary"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={t("aria.toggleEligibilityDetails")}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
            </Button>
          </CollapsibleTrigger>

          <span className="min-w-[min(100%,10rem)] flex-1 text-sm font-bold text-foreground">
            {eligibility.name}
          </span>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("status.active")}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={toggleActive}
                aria-label={`Toggle ${eligibility.name} active status`}
                disabled={isHistorical}
              />
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onDuplicate(eligibility.id)}
              disabled={isHistorical}
            >
              <Copy className="mr-1 h-4 w-4" />
              {t("buttons.duplicateEligibility")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">
                    {t("aria.actionsFor", { name: eligibility.name })}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete(eligibility.id)}
                  variant="destructive"
                  disabled={isHistorical}
                >
                  {t("buttons.deleteEligibility")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-start gap-4 bg-gray-100 p-4">
              <CapacityDurationCard
                form={form}
                validityDates={validityDates}
                eligibilityId={eligibility.id}
                serviceId={eligibility.serviceId}
                saveAttempted={saveAttempted}
                disabled={isHistorical}
                onAddValidityDate={addValidityDate}
                onRemoveValidityDate={removeValidityDate}
                onUpdateValidityDate={updateValidityDate}
              />
              <PaxCompositionCard
                compositionGroups={paxCompositionGroups}
                saveAttempted={saveAttempted}
                onAddCompositionGroup={addPaxCompositionGroup}
                onRemoveCompositionGroup={removePaxCompositionGroup}
                onAddPaxTypeConstraint={addPaxTypeConstraint}
                onUpdatePaxTypeConstraint={updatePaxTypeConstraint}
                onAddAgeRestriction={addAgeRestriction}
                onRemoveAgeRestriction={removeAgeRestriction}
                onUpdateAgeRestriction={updateAgeRestriction}
                disabled={isHistorical}
              />
            </div>

            <EligibilitySaveFooter
              eligibilityId={eligibility.id}
              serviceId={eligibility.serviceId}
              validityDates={validityDates}
              fieldErrors={fieldErrors}
              submitErrors={submitErrors}
              saveAttempted={saveAttempted}
              onSaveAttempted={setSaveAttempted}
              isDirty={!isHistorical && (isNew || isDirty)}
              canSubmit={canSubmit}
              isSaving={isSaving}
              onSave={handleSave}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
