import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import { useSafariPlanners } from "@/entities/safari-planners/api/useSafariPlanners";
import type { AgentFormData } from "@/features/edit-agent";

/** Minimal form data used by this card; shared by create and edit flows. */
type GeneralInformationFormData = Pick<
  AgentFormData,
  | "firstName"
  | "lastName"
  | "agencyId"
  | "assignedSafariPlannerId"
  | "assignedSafariPlannerName"
>;

interface GeneralInformationErrors {
  firstName?: string;
  lastName?: string;
  agencyId?: string;
  assignedSafariPlannerId?: string;
}

interface GeneralInformationCardProps {
  formData: GeneralInformationFormData;
  errors: GeneralInformationErrors;
  updateField: <K extends keyof GeneralInformationFormData>(
    field: K,
    value: GeneralInformationFormData[K]
  ) => void;
  /** Agency display name (read-only; edit mode when agent is tied to one agency) */
  agencyName?: string;
  /** Agency options for dropdown (create mode). When provided, Agency is a Select. */
  agencies?: { id: string; name: string }[];
}

export function GeneralInformationCard({
  formData,
  errors,
  updateField,
  agencyName = "",
  agencies,
}: GeneralInformationCardProps) {
  const { t } = useTranslation(["admin", "common"]);
  const isCreateMode = agencies && agencies.length > 0;
  const { data: safariPlanners = [], isLoading: isSafariPlannersLoading } =
    useSafariPlanners();

  const currentId =
    formData.assignedSafariPlannerId != null
      ? String(formData.assignedSafariPlannerId)
      : "";
  const currentName = formData.assignedSafariPlannerName ?? "";

  const selectedFromList = safariPlanners.find((sp) => sp.id === currentId);

  const fallbackOption =
    currentId && !selectedFromList && currentName
      ? { id: currentId, userName: currentName }
      : null;

  const restOptions = safariPlanners.filter((sp) => sp.id !== currentId);
  const plannerOptions = selectedFromList
    ? [selectedFromList, ...restOptions]
    : fallbackOption
      ? [fallbackOption, ...safariPlanners]
      : safariPlanners;

  return (
    <Card id="general-information" className="rounded-md">
      <CardHeader>
        <CardTitle>{t("sections.generalInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="form-grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="agent-firstName">
              {t("labels.firstName")}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agent-firstName"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder={t("placeholders.exampleJonathan")}
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
          <div className="space-y-2">
            <Label htmlFor="agent-agency">
              {t("labels.agency")}
              <span className="text-destructive">*</span>
            </Label>
            {isCreateMode ? (
              <Select
                value={formData.agencyId}
                onValueChange={(v) => updateField("agencyId", v as string)}
              >
                <SelectTrigger
                  id="agent-agency"
                  className={cn(
                    errors.agencyId && "border-destructive",
                    "w-full"
                  )}
                >
                  <SelectValue placeholder={t("placeholders.selectAgency")} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="agent-agency"
                value={agencyName}
                readOnly
                disabled
                className="bg-muted"
              />
            )}
            {isCreateMode && errors.agencyId && (
              <p className="text-sm text-destructive">{errors.agencyId}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-assignedSafariPlanner">
              {t("labels.assignedSafariPlanner")}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={currentId}
              onValueChange={(v) => {
                const next = v ?? "";
                if (next && next !== currentId) {
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
        </div>
      </CardContent>
    </Card>
  );
}
