import type { ServiceEligibility } from "@/entities/service-eligibility";

import type { EligibilityFormValues } from "./useEligibilityForm";

export interface ServiceEligibilitySectionActions {
  submitButtonLabel: string;
  onCreateEligibility: () => void;
  onSave: () => void;
  onSaveAndCreateNew: () => void;
  onDiscard: () => void;
  isPending: boolean;
  disableSave: boolean;
  hasUnsavedChanges: boolean;
}

export type ServiceEligibilityActionHandlers = Pick<
  ServiceEligibilitySectionActions,
  "onCreateEligibility" | "onSave" | "onSaveAndCreateNew" | "onDiscard"
>;

export interface ServiceEligibilityItemHandlers {
  validate: () => Promise<boolean>;
  isDirty: () => boolean;
  saveAsync: () => Promise<ServiceEligibility | undefined>;
  cancel: () => void;
}

export type ServiceEligibilitySaveHandler = (
  id: string,
  values: EligibilityFormValues,
  version: number
) => Promise<ServiceEligibility | undefined>;
