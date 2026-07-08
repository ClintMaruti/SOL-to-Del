import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  cn,
} from "@sol/ui";
import { useForm, useStore } from "@tanstack/react-form";
import { ChevronDown, Copy, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ServiceRate } from "@/entities/service-rate";
import type {
  RateRule,
  RateRuleSaveValidationErrorKey,
  RuleCondition,
} from "@/entities/service-option-rate-plan";
import { FormField, SaveButton } from "@/shared/ui";

import { createComponent, createCondition } from "../lib/defaults";
import { componentIndicesWithDuplicatePriorityPax } from "../lib/rateRuleValidation";

import { ComponentCard } from "./ComponentCard";
import { ConditionsTable } from "./ConditionsTable";

interface RateRuleCardProps {
  rateRule: RateRule;
  /** Service option rates (GET .../rates); drives rate single-select + FOC. */
  rates: ServiceRate[];
  onChange: (next: RateRule) => void;
  onDuplicate: (rule: RateRule) => void;
  onDelete: (ruleId: string) => void;
  onSave?: (rule: RateRule) => void;
  isSaving?: boolean;
  isSaved?: boolean;
  /** Server delete in progress for this rule (shows loading on delete control). */
  isDeletePending?: boolean;
  canSave?: boolean;
  /** Hard validation error from parent (blocks save). */
  saveValidationError?: RateRuleSaveValidationErrorKey | null;
  /** Non-blocking overlap warning from parent. */
  showOverlapWarning?: boolean;
  /** When true, disables duplicate/delete/add/save and nested structure actions (e.g. travel overlap lock). */
  actionsLocked?: boolean;
  /** Tooltip/title for disabled controls when actionsLocked. */
  actionsLockedTitle?: string;
  allowedPaxOptions?: Array<"ADT" | "CHD" | "INF" | "YTH">;
  defaultOpen?: boolean;
}

export function RateRuleCard({
  rateRule,
  rates,
  onChange,
  onDuplicate,
  onDelete,
  onSave,
  isSaving = false,
  isSaved = false,
  isDeletePending = false,
  canSave = true,
  saveValidationError = null,
  showOverlapWarning = false,
  actionsLocked = false,
  actionsLockedTitle,
  allowedPaxOptions = ["ADT", "CHD", "INF", "YTH"],
  defaultOpen = true,
}: RateRuleCardProps) {
  const { t } = useTranslation("admin");
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const skipInitialSyncRef = useRef(true);
  const prevRuleRef = useRef<{ id: string; version: number }>({
    id: rateRule.id,
    version: rateRule.version,
  });
  const form = useForm({
    defaultValues: rateRule,
  });
  const values = useStore(form.store, (s) => s.values) as RateRule;
  const isDirty = useStore(form.store, (s) => s.isDirty);
  /** Duplicated / new rules keep tmp ids until first POST; allow Save without an edit (form is still clean). */
  const needsInitialServerSave = values.id.startsWith("tmp-");

  /** Parent passes an inline `onChange`; keep latest in a ref without assigning during render (React Compiler). */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Avoid marking parent CRP form dirty on first mount.
    if (skipInitialSyncRef.current) {
      skipInitialSyncRef.current = false;
      return;
    }
    onChangeRef.current(values);
  }, [values]);

  useEffect(() => {
    const changedIdentity =
      rateRule.id !== prevRuleRef.current.id ||
      rateRule.version !== prevRuleRef.current.version;
    if (!changedIdentity) return;
    prevRuleRef.current = { id: rateRule.id, version: rateRule.version };
    skipInitialSyncRef.current = true;
    form.reset(rateRule);
  }, [form, rateRule]);

  const addCondition = () => {
    const paxCount = values.conditions.filter(
      (c) => c.condition === "Pax"
    ).length;
    const nextPax = allowedPaxOptions[0];
    const canAddPaxRow = paxCount < 4 && nextPax != null;
    const nextCondition: RuleCondition = canAddPaxRow
      ? { ...createCondition(), option: nextPax }
      : {
          ...createCondition(),
          condition: "Nights" as const,
          option: "Number" as const,
        };
    form.setFieldValue("conditions", [...values.conditions, nextCondition]);
  };

  const addComponent = () => {
    form.setFieldValue("components", [...values.components, createComponent()]);
  };

  const deleteComponent = (index: number) => {
    form.setFieldValue(
      "components",
      values.components.filter((_, i) => i !== index)
    );
  };

  const duplicatePriorityPaxIndices = useMemo(
    () => componentIndicesWithDuplicatePriorityPax(values.components),
    [values.components]
  );
  const hasValidationError = saveValidationError != null;
  const saveBlocked = !canSave || hasValidationError;

  /** Unique DOM ids for this rule's fields (several rules share TanStack paths like `conditions[0].min`). */
  const ruleFieldIdPrefix = `rr-${rateRule.id}`;
  const isDraft = values.id.startsWith("tmp-");
  /** Only unsaved drafts use a name input; persisted rules show a read-only title. */
  const showNameInput = isDraft;
  const headerTitle =
    values.name.trim() || rateRule.name.trim() || t("sections.rateRule");

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border border-border-tertiary">
        {/* Header — Figma: collapse + rule name as title; name input only while drafting */}
        <div className="flex items-center justify-between gap-4 rounded-t-md border-b border-border-tertiary px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline-secondary"
                size="icon"
                className="size-9 shrink-0"
                aria-label={isOpen ? t("aria.collapse") : t("aria.expand")}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    !isOpen && "-rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {showNameInput ? (
              <FormField
                form={form}
                name="name"
                htmlIdPrefix={ruleFieldIdPrefix}
                required
                className="min-w-0 flex-1"
              >
                {(field) => (
                  <Input
                    value={(field.state.value as string) ?? ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      if (!isOpen) {
                        setIsOpen(true);
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder={t("sections.rateRule")}
                    aria-invalid={field.state.meta.errors.length > 0}
                    disabled={actionsLocked}
                    title={actionsLocked ? actionsLockedTitle : undefined}
                    className={cn(
                      "h-9 bg-background-primary shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>
            ) : (
              <span className="truncate text-base font-semibold leading-6 text-text-primary">
                {headerTitle}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Button
              type="button"
              variant="outline-secondary"
              className="gap-1"
              disabled={actionsLocked}
              title={actionsLocked ? actionsLockedTitle : undefined}
              onClick={() => onDuplicate(values)}
            >
              <Copy className="size-4" />
              {t("buttons.duplicateRateRule")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-brand-red hover:text-destructive"
              disabled={actionsLocked || isDeletePending}
              isLoading={isDeletePending}
              title={actionsLocked ? actionsLockedTitle : undefined}
              onClick={() => onDelete(values.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t("common:buttons.delete")}</span>
            </Button>
          </div>
        </div>

        {/* forceMount: keep nested FormFields mounted when collapsed so TanStack Form
            validateAllFields + fieldMeta stay consistent (unmounted fields skip validation
            but can still contribute stale invalid meta to isFieldsValid). */}
        <CollapsibleContent forceMount>
          <div
            className={cn(
              "border-t border-border bg-white px-4 py-3",
              !isOpen && "hidden"
            )}
          >
            {hasValidationError ? (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-red-100 bg-red-100 px-3 py-2 text-sm text-red-600">
                <TriangleAlert className="h-4 w-4 shrink-0 text-red-600" />
                <span className="font-bold">
                  {t(`errors.${saveValidationError}`)}
                </span>
              </div>
            ) : null}

            {showOverlapWarning && !hasValidationError ? (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700" />
                <span>{t("errors.rateRuleOverlapDetected")}</span>
              </div>
            ) : null}

            {/* CONDITIONS */}
            <div className="mb-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                  {t("sections.conditions")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={actionsLocked}
                  title={actionsLocked ? actionsLockedTitle : undefined}
                  onClick={addCondition}
                >
                  <Plus className="mr-0.5 h-3 w-3" />
                  {t("buttons.addCondition")}
                </Button>
              </div>
              {values.conditions.length > 0 && (
                <ConditionsTable
                  form={form}
                  fieldPrefix={"conditions"}
                  htmlIdPrefix={ruleFieldIdPrefix}
                  conditions={values.conditions}
                  allowedPaxOptions={allowedPaxOptions}
                  actionsLocked={actionsLocked}
                  actionsLockedTitle={actionsLockedTitle}
                />
              )}
            </div>

            <div className="my-4 h-px bg-border" />

            {/* COMPONENTS */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                  {t("sections.components")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={actionsLocked}
                  title={actionsLocked ? actionsLockedTitle : undefined}
                  onClick={addComponent}
                >
                  <Plus className="mr-0.5 h-3 w-3" />
                  {t("buttons.addComponent")}
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {values.components.map((comp, i) => (
                  <ComponentCard
                    key={comp.id}
                    form={form}
                    fieldPrefix={`components[${i}]`}
                    htmlIdPrefix={ruleFieldIdPrefix}
                    component={comp}
                    rates={rates}
                    allowedPaxOptions={allowedPaxOptions}
                    onDelete={() => deleteComponent(i)}
                    hasPriorityConflict={duplicatePriorityPaxIndices.has(i)}
                    actionsLocked={actionsLocked}
                    actionsLockedTitle={actionsLockedTitle}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <SaveButton
                isSavedState={isSaved && !isDirty}
                isLoading={isSaving}
                disabled={
                  saveBlocked ||
                  actionsLocked ||
                  (!isDirty && !needsInitialServerSave)
                }
                title={
                  hasValidationError
                    ? t(`errors.${saveValidationError}`)
                    : actionsLocked
                      ? actionsLockedTitle
                      : undefined
                }
                onClick={() => onSave?.(values)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
