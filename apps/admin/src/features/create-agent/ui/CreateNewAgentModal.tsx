import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
  toast,
} from "@sol/ui";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAgent, useUpdateAgent } from "@/entities/agent";
import type { Agent } from "@/entities/agent/model/types";
import { useSafariPlanners } from "@/entities/safari-planners/api/useSafariPlanners";
import { useAgentForm } from "@/features/edit-agent/model/useAgentForm";
import { safeParseSubmitData } from "@/shared/lib/form";

import { useCreateAgent } from "../api/useCreateAgent";
import { createAgentSubmitSchema } from "../model/schema";

interface CreateNewAgentModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when an agent is successfully created (e.g. to add to agency form agents list) */
  onAgentCreated?: (agent: Agent) => void;
  onAgentUpdated?: (agent: Agent) => void;
  agent?: Agent | null;
  agencyId?: string;
}

export function CreateNewAgentModal({
  open,
  onOpenChange,
  onAgentCreated,
  onAgentUpdated,
  agent,
  agencyId,
}: CreateNewAgentModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { data: fullAgent } = useAgent(open && agent?.id ? agent.id : null);
  const agentForForm = agent ? (fullAgent ?? agent) : undefined;
  const { formData, errors, updateField, validate, reset, getSubmitData } =
    useAgentForm(agentForForm);
  const { data: safariPlanners = [], isLoading: isSafariPlannersLoading } =
    useSafariPlanners();

  const currentSpId =
    formData.assignedSafariPlannerId != null
      ? String(formData.assignedSafariPlannerId)
      : "";
  const currentSpName = formData.assignedSafariPlannerName ?? "";
  const selectedSpFromList = safariPlanners.find((sp) => sp.id === currentSpId);
  const spFallback =
    currentSpId && !selectedSpFromList && currentSpName
      ? { id: currentSpId, userName: currentSpName }
      : null;
  const spRestOptions = safariPlanners.filter((sp) => sp.id !== currentSpId);
  const plannerOptions = selectedSpFromList
    ? [selectedSpFromList, ...spRestOptions]
    : spFallback
      ? [spFallback, ...safariPlanners]
      : safariPlanners;
  const {
    mutate: createAgent,
    isPending,
    error: createError,
    reset: resetCreateMutation,
  } = useCreateAgent();
  const {
    mutate: updateAgent,
    isPending: isUpdating,
    error: updateError,
    reset: resetUpdateMutation,
  } = useUpdateAgent();

  useEffect(() => {
    if (!open) {
      reset();
      resetCreateMutation();
      resetUpdateMutation();
    }
  }, [open, reset, resetCreateMutation, resetUpdateMutation]);

  useEffect(() => {
    if (agencyId) {
      updateField("agencyId", agencyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid } = validate();
    if (!valid) return;
    if (agent) {
      const data = getSubmitData();
      if (!data) return;
      updateAgent(
        {
          id: agent.id,
          data,
        },
        {
          onSuccess: (agent) => {
            reset();
            onOpenChange?.(false);
            onAgentUpdated?.(agent);
            toast.success(t("modals.agentUpdatedSuccess"));
          },
        }
      );
    } else {
      const result = safeParseSubmitData(createAgentSubmitSchema, formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      createAgent(result.data, {
        onSuccess: (agent) => {
          onAgentCreated?.(agent);
          toast.success(t("modals.agentCreatedSuccess"));
          reset();
          onOpenChange?.(false);
        },
      });
    }
  };

  const handleCancel = () => {
    reset();
    resetCreateMutation();
    resetUpdateMutation();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px] px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground leading-7">
            {agent ? t("modals.editAgent") : t("modals.createNewAgent")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-6 font-normal">
            {agent ? undefined : t("modals.createNewAgentDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-firstName">
                {t("labels.firstName")}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-firstName"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder={t("placeholders.exampleName")}
                className={cn(errors.firstName && "border-destructive")}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-lastName">
                {t("labels.lastName")}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-lastName"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder={t("placeholders.exampleAnnan")}
                className={cn(errors.lastName && "border-destructive")}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-primaryEmail">
              {t("labels.email")}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agent-primaryEmail"
              type="email"
              value={formData.primaryEmail}
              onChange={(e) => updateField("primaryEmail", e.target.value)}
              placeholder={t("placeholders.exampleEmail")}
              className={cn(errors.primaryEmail && "border-destructive")}
            />
            {errors.primaryEmail && (
              <p className="text-sm text-destructive">{errors.primaryEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-alternateEmail">
              {t("labels.alternateEmail")}
            </Label>
            <Input
              id="agent-alternateEmail"
              type="email"
              value={formData.alternateEmail}
              onChange={(e) => updateField("alternateEmail", e.target.value)}
              placeholder={t("common:placeholders.optional")}
              className={cn(errors.alternateEmail && "border-destructive")}
            />
            {errors.alternateEmail && (
              <p className="text-sm text-destructive">
                {errors.alternateEmail}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-phone">
              {t("labels.phone")} <span className="text-destructive">*</span>
            </Label>
            <PhoneInput
              id="agent-phone"
              value={formData.phone}
              onChange={(value) => updateField("phone", value)}
              placeholder={t("placeholders.examplePhone")}
              error={errors.phone}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-notes">{t("labels.notes")}</Label>
            <Textarea
              id="agent-notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder={t("placeholders.optionalNotes")}
              className={cn(errors.notes && "border-destructive")}
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-assignedSafariPlanner">
              {t("labels.assignedSafariPlanner")}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={currentSpId}
              onValueChange={(v) => {
                const next = v ?? "";
                if (next && next !== currentSpId) {
                  updateField("assignedSafariPlannerId", next);
                  const planner = safariPlanners.find((sp) => sp.id === next);
                  if (planner) {
                    updateField("assignedSafariPlannerName", planner.userName);
                  }
                }
              }}
            >
              <SelectTrigger
                id="agent-assignedSafariPlanner"
                className={cn(
                  errors.assignedSafariPlannerId && "border-destructive",
                  "w-full"
                )}
              >
                <SelectValue
                  placeholder={
                    isSafariPlannersLoading
                      ? t("common:messages.loading")
                      : t("placeholders.selectAssignedSp")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {plannerOptions.map(({ id, userName }) => (
                  <SelectItem key={id} value={id}>
                    {userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedSafariPlannerId && (
              <p className="text-sm text-destructive">
                {errors.assignedSafariPlannerId}
              </p>
            )}
          </div>

          {(createError || updateError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                {getErrorMessage(
                  createError || updateError,
                  t("errors.failedToSaveAgent")
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending || isUpdating}
            >
              {agent ? t("buttons.updateAgent") : t("modals.createAgent")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
