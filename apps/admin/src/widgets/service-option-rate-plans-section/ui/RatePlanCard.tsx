import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
  Switch,
  cn,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { ChevronDown, Copy, Plus } from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { getErrorMessage, useQueryClient } from "@sol/api-client";
import { toast } from "@sol/ui";

import {
  mapApiRateRuleToFormModel,
  mapFormRateRuleToCreatePayload,
  mapFormRateRuleToUpdatePayload,
  useCreateRateRule,
  useDeleteRateRule,
  useRateRules,
  useToggleRatePlanStatus,
  useUpdateRateRule,
  type RatePlan,
  type RateRule,
} from "@/entities/service-option-rate-plan";
import { useServiceRates } from "@/entities/service-rate";
import {
  useRatePlanForm,
  type RatePlanFormValues,
} from "@/features/manage-service-option-rate-plans";
import { DatePickerGridInput, FormField, SaveButton } from "@/shared/ui";

import { createRateRule } from "../lib/defaults";
import { persistDuplicatedRateRulesToPlan } from "../lib/duplicateRatePlanDraft";
import {
  buildRateRuleValidationOptions,
  DEFAULT_RATE_RULE_PAX_OPTIONS,
  validateRateRuleForPlanSave,
} from "../lib/rateRuleValidation";

import { RateRuleCard } from "./RateRuleCard";

function isDraftRatePlanId(id: string): boolean {
  return id.startsWith("tmp-rate-plan-");
}

/** Aligns icon-only collapse control with labeled form inputs. */
const FG_LABEL_ROW_SPACER =
  "h-[calc(var(--field-group-top-padding-y)*2+var(--field-group-label-line-height))] shrink-0";

interface RatePlanCardProps {
  entryKey: string;
  ratePlan: RatePlan;
  serviceId: string;
  existingNames?: string[];
  initialFormValues?: RatePlanFormValues;
  initialRateRules?: RateRule[];
  defaultOpen?: boolean;
  expandRatePlanId?: string | null;
  onDuplicate?: (source: RatePlan, sourceRules: RateRule[]) => void;
  onDraftPersisted?: (draftId: string) => void;
}

export function RatePlanCard({
  entryKey: _entryKey,
  ratePlan,
  serviceId,
  existingNames = [],
  initialFormValues,
  initialRateRules,
  defaultOpen = true,
  expandRatePlanId = null,
  onDuplicate,
  onDraftPersisted,
}: RatePlanCardProps) {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();
  const isDraft = isDraftRatePlanId(ratePlan.id);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Auto-expand when deep linked
  useEffect(() => {
    if (expandRatePlanId && ratePlan.id && expandRatePlanId === ratePlan.id) {
      startTransition(() => setIsOpen(true));
    }
  }, [expandRatePlanId, ratePlan.id]);

  const toggleStatusMutation = useToggleRatePlanStatus();

  const isNameUnique = useCallback(
    (name: string) =>
      !existingNames.some(
        (n) => n.toLowerCase() === name.toLowerCase() && n !== ratePlan.name
      ),
    [existingNames, ratePlan.name]
  );

  const draftRulesToPersistRef = useRef<RateRule[]>(initialRateRules ?? []);

  const persistedRatePlanId = isDraft ? null : ratePlan.id;

  const { data: serviceRates = [] } = useServiceRates(serviceId);

  // Rate rules
  const {
    data: apiRules = [],
    isLoading: rulesLoading,
    error: rulesError,
  } = useRateRules(persistedRatePlanId);

  const [draftRuleIds, setDraftRuleIds] = useState<string[]>(
    () => initialRateRules?.map((r) => r.id) ?? []
  );
  const [ruleFormStates, setRuleFormStates] = useState<
    Record<string, RateRule>
  >(() =>
    initialRateRules
      ? Object.fromEntries(initialRateRules.map((r) => [r.id, r]))
      : {}
  );

  const serverRules = useMemo(
    () => apiRules.map((r) => mapApiRateRuleToFormModel(r)),
    [apiRules]
  );

  const allRules = useMemo(() => {
    const serverById = Object.fromEntries(serverRules.map((r) => [r.id, r]));
    const merged = serverRules.map((r) => ruleFormStates[r.id] ?? r);
    const drafts = draftRuleIds
      .filter((id) => !serverById[id])
      .map((id) => ruleFormStates[id] ?? createRateRule(ratePlan.id));
    return [...merged, ...drafts];
  }, [serverRules, draftRuleIds, ruleFormStates, ratePlan.id]);

  const rateRuleValidationOptions = useMemo(
    () =>
      buildRateRuleValidationOptions(
        serviceRates,
        DEFAULT_RATE_RULE_PAX_OPTIONS
      ),
    [serviceRates]
  );

  const ruleValidationById = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof validateRateRuleForPlanSave>
    >();
    for (const rule of allRules) {
      map.set(
        rule.id,
        validateRateRuleForPlanSave(rule, allRules, rateRuleValidationOptions)
      );
    }
    return map;
  }, [allRules, rateRuleValidationOptions]);

  const applyRuleSaveValidation = useCallback(
    (rule: RateRule) => {
      const { error, warnings } = validateRateRuleForPlanSave(
        rule,
        allRules,
        rateRuleValidationOptions
      );
      if (error) {
        toast.error(t(`errors.${error}`));
        return false;
      }
      if (warnings.includes("rateRuleOverlapDetected")) {
        toast.warning(t("errors.rateRuleOverlapDetected"));
      }
      return true;
    },
    [allRules, rateRuleValidationOptions, t]
  );

  const { form, isDirty, handleSave, isSubmitting, isSuccess } =
    useRatePlanForm(
      isDraft ? null : ratePlan,
      serviceId,
      isDraft ? null : ratePlan.id,
      isDraft ? (initialFormValues ?? null) : null,
      {
        isNameUnique,
        onRatePlanCreated: async (created) => {
          if (!isDraft) return;
          const rules = draftRulesToPersistRef.current;
          if (rules.length > 0) {
            for (const rule of rules) {
              const { error, warnings } = validateRateRuleForPlanSave(
                rule,
                rules,
                rateRuleValidationOptions
              );
              if (error) {
                toast.error(t(`errors.${error}`));
                return;
              }
              if (warnings.includes("rateRuleOverlapDetected")) {
                toast.warning(t("errors.rateRuleOverlapDetected"));
              }
            }
            try {
              await persistDuplicatedRateRulesToPlan(
                created.id,
                rules,
                queryClient
              );
            } catch {
              toast.error(t("errors.failedToSaveRateRule"));
              return;
            }
          }
          onDraftPersisted?.(ratePlan.id);
        },
      }
    );

  const formValues = useStore(form.store, (s) => s.values);
  const isSaved = isSuccess && !isDirty;

  const handleToggleActive = useCallback(
    (active: boolean) => {
      if (isDraft) {
        form.setFieldValue("isActive", active);
        return;
      }
      toggleStatusMutation.mutate({
        serviceId,
        ratePlanId: ratePlan.id,
        active,
      });
    },
    [form, isDraft, serviceId, ratePlan.id, toggleStatusMutation]
  );

  useEffect(() => {
    if (isDraft) {
      draftRulesToPersistRef.current = allRules;
    }
  }, [isDraft, allRules]);

  const handleDuplicate = useCallback(() => {
    onDuplicate?.(ratePlan, allRules);
  }, [onDuplicate, ratePlan, allRules]);

  const createRuleMutation = useCreateRateRule(ratePlan.id);
  const updateRuleMutation = useUpdateRateRule(ratePlan.id);
  const deleteRuleMutation = useDeleteRateRule(ratePlan.id);

  const [savingRuleIds, setSavingRuleIds] = useState<Set<string>>(new Set());
  const [savedRuleIds, setSavedRuleIds] = useState<Set<string>>(new Set());

  const handleAddRule = useCallback(() => {
    const draft = createRateRule(ratePlan.id);
    setDraftRuleIds((prev) => [...prev, draft.id]);
    setRuleFormStates((prev) => ({ ...prev, [draft.id]: draft }));
  }, [ratePlan.id]);

  const handleRuleChange = useCallback((ruleId: string, next: RateRule) => {
    setRuleFormStates((prev) => ({ ...prev, [ruleId]: next }));
  }, []);

  const handleRuleDuplicate = useCallback(
    (rule: RateRule) => {
      const draft = createRateRule(ratePlan.id);
      const clone: RateRule = {
        ...rule,
        id: draft.id,
        name: `${rule.name} (copy)`,
        version: 0,
        conditions: rule.conditions.map((c) => ({
          ...c,
          id: `tmp-cond-${crypto.randomUUID()}`,
        })),
        components: rule.components.map((c) => ({
          ...c,
          id: `tmp-comp-${crypto.randomUUID()}`,
          componentConditions: c.componentConditions.map((cc) => ({
            ...cc,
            id: `tmp-cc-${crypto.randomUUID()}`,
          })),
          componentDates: c.componentDates.map((d) => ({
            ...d,
            id: `tmp-cd-${crypto.randomUUID()}`,
          })),
        })),
      };
      setDraftRuleIds((prev) => [...prev, clone.id]);
      setRuleFormStates((prev) => ({ ...prev, [clone.id]: clone }));
    },
    [ratePlan.id]
  );

  const handleRuleSave = useCallback(
    async (rule: RateRule) => {
      if (isDraft) {
        toast.error(t("empty.saveRatePlanBeforeRateRules"));
        return;
      }
      if (!applyRuleSaveValidation(rule)) {
        return;
      }
      setSavingRuleIds((prev) => new Set(prev).add(rule.id));
      try {
        const isDraftRule = rule.id.startsWith("tmp-");
        if (isDraftRule) {
          const payload = mapFormRateRuleToCreatePayload(rule);
          await createRuleMutation.mutateAsync(payload);
          setDraftRuleIds((prev) => prev.filter((id) => id !== rule.id));
          setRuleFormStates((prev) => {
            const next = { ...prev };
            delete next[rule.id];
            return next;
          });
        } else {
          const payload = mapFormRateRuleToUpdatePayload(rule);
          await updateRuleMutation.mutateAsync({
            rateRuleId: rule.id,
            payload,
          });
          setSavedRuleIds((prev) => new Set(prev).add(rule.id));
          setTimeout(() => {
            setSavedRuleIds((prev) => {
              const next = new Set(prev);
              next.delete(rule.id);
              return next;
            });
          }, 3000);
        }
      } catch {
        // errors handled in mutation hooks
      } finally {
        setSavingRuleIds((prev) => {
          const next = new Set(prev);
          next.delete(rule.id);
          return next;
        });
      }
    },
    [
      applyRuleSaveValidation,
      createRuleMutation,
      updateRuleMutation,
      isDraft,
      t,
    ]
  );

  const handleRuleDelete = useCallback(
    async (ruleId: string) => {
      if (ruleId.startsWith("tmp-")) {
        setDraftRuleIds((prev) => prev.filter((id) => id !== ruleId));
        setRuleFormStates((prev) => {
          const next = { ...prev };
          delete next[ruleId];
          return next;
        });
        return;
      }
      await deleteRuleMutation.mutateAsync(ruleId);
    },
    [deleteRuleMutation]
  );

  const isToggling = toggleStatusMutation.isPending;

  return (
    <div
      id={`service-rate-plan-${ratePlan.id}`}
      className="rounded-md border border-border bg-white shadow-xs"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Rate plan header — flexible fields; actions stay on one row when zoomed */}
        <div className="grid grid-cols-12 gap-x-2 gap-y-2 px-4 py-3 xl:items-end">
          <div className="col-span-12 flex min-w-0 flex-nowrap items-end gap-x-2 overflow-x-auto xl:col-span-9">
            <div className="flex shrink-0 flex-col">
              <div className={FG_LABEL_ROW_SPACER} aria-hidden />
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
            </div>

            <FormField
              form={form}
              name="name"
              label={t("labels.ratePlanName")}
              required
              className="min-w-[min(100%,8rem)] w-[12rem] max-w-[14rem] shrink"
            >
              {(field) => (
                <input
                  className={cn(
                    "flex h-9 w-full rounded-[6px] border border-border-tertiary bg-background-primary px-3 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </FormField>

            <div className="flex shrink-0 items-end gap-x-2">
              <FormField
                form={form}
                name="validityDateFrom"
                label={t("labels.validityDateFrom")}
                required
                className="min-w-[8.75rem] w-[8.75rem]"
              >
                {(field) => (
                  <DatePickerGridInput
                    value={field.state.value as string}
                    onChange={(v) => field.handleChange(v ?? "")}
                    placeholder={t("placeholders.selectStartDate")}
                    className={cn(
                      "h-9 w-full bg-background-primary shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>

              <FormField
                form={form}
                name="validityDateTo"
                label={t("labels.validityDateTo")}
                className="min-w-[8.75rem] w-[8.75rem]"
              >
                {(field) => (
                  <DatePickerGridInput
                    value={(field.state.value as string | null) ?? ""}
                    onChange={(v) => field.handleChange(v ?? null)}
                    placeholder={t("placeholders.selectEndDate")}
                    className={cn(
                      "h-9 w-full bg-background-primary shadow-none",
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                )}
              </FormField>
            </div>

            <div className="flex shrink-0 flex-col">
              <div className={FG_LABEL_ROW_SPACER} aria-hidden />
              <div className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap">
                <span className="shrink-0 text-sm font-medium text-text-primary">
                  {t("labels.payAtProperty")}
                </span>
                <Switch
                  checked={formValues.payAtProperty}
                  onCheckedChange={(v) =>
                    form.setFieldValue("payAtProperty", v)
                  }
                  aria-label={t("labels.payAtProperty")}
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 flex shrink-0 flex-col xl:col-span-3">
            <div
              className={cn(FG_LABEL_ROW_SPACER, "hidden xl:block")}
              aria-hidden
            />
            <div className="flex h-9 shrink-0 flex-nowrap items-center justify-end gap-3">
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-medium text-text-primary">
                  {t("status.active")}
                </span>
                <Switch
                  checked={isDraft ? formValues.isActive : ratePlan.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={!isDraft && isToggling}
                  aria-label={t("aria.toggleActiveStatus", {
                    name: ratePlan.name,
                  })}
                />
              </div>
              <Button
                type="button"
                variant="outline-secondary"
                className="h-9 shrink-0 gap-1"
                onClick={handleDuplicate}
              >
                <Copy className="size-4" />
                {t("buttons.duplicate")}
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          {/* Toolbar: Add Rate Rule (left) + rate plan Save (right) */}
          <div className="flex items-center justify-between border-t border-border-tertiary bg-background-primary px-4 py-3">
            <Button
              type="button"
              variant="outline-secondary"
              className="gap-1"
              onClick={handleAddRule}
            >
              <Plus className="size-4" />
              {t("buttons.addRateRule")}
            </Button>
            <SaveButton
              isSavedState={isSaved && !isDraft}
              isLoading={isSubmitting}
              disabled={!isDraft && !isDirty && !isSubmitting}
              onClick={handleSave}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border-tertiary px-4 py-4">
            {allRules.length > 0 ? (
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                {t("sections.rateRules")}
              </p>
            ) : null}

            {!isDraft && rulesLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !isDraft && rulesError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(rulesError, t("errors.failedToLoadRateRules"))}
              </p>
            ) : isDraft || (!rulesLoading && !rulesError) ? (
              allRules.map((rule) => {
                const validation =
                  ruleValidationById.get(rule.id) ??
                  validateRateRuleForPlanSave(
                    rule,
                    allRules,
                    rateRuleValidationOptions
                  );
                return (
                  <RateRuleCard
                    key={rule.id}
                    rateRule={rule}
                    rates={serviceRates}
                    onChange={(next) => handleRuleChange(rule.id, next)}
                    onDuplicate={handleRuleDuplicate}
                    onDelete={handleRuleDelete}
                    onSave={handleRuleSave}
                    isSaving={savingRuleIds.has(rule.id)}
                    isSaved={savedRuleIds.has(rule.id)}
                    isDeletePending={deleteRuleMutation.isPending}
                    canSave={validation.error === null}
                    saveValidationError={validation.error}
                    showOverlapWarning={validation.warnings.includes(
                      "rateRuleOverlapDetected"
                    )}
                    allowedPaxOptions={DEFAULT_RATE_RULE_PAX_OPTIONS}
                    defaultOpen={rule.id.startsWith("tmp-")}
                  />
                );
              })
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
