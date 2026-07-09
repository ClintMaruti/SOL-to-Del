import {
  Button,
  FieldGroup,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@sol/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DatePickerGridInput } from "@/shared/ui";

import type { AssignGuestValues, GuestSlot, Salutation } from "../model/types";

import { DashedSeparator } from "./DashedSeparator";
import { SegmentedToggle } from "./SegmentedToggle";

const SALUTATION_OPTIONS: Salutation[] = ["Mrs", "Ms", "Mr"];
const ADULT_AGE_OPTIONS = Array.from({ length: 83 }, (_, index) => index + 18);
const CHILD_AGE_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 2);

interface AssignGuestsPanelProps {
  slots: GuestSlot[];
  guestValues: Record<string, AssignGuestValues>;
  expandedSlotId: string | null;
  disabled?: boolean;
  onExpandedSlotChange: (slotId: string | null) => void;
  onGuestChange: (
    slotId: string,
    patch: Partial<AssignGuestValues>
  ) => void;
  onAdvanceToNext: (currentSlotId: string) => void;
}

function getSlotLabel(
  slot: GuestSlot,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (slot.labelKey === "leadTraveler") {
    return t("itineraries.guestDetails.assign.leadTraveler");
  }

  return t(`itineraries.guestDetails.assign.${slot.labelKey}`, {
    number: slot.index,
  });
}

interface GuestAssignFormProps {
  slot: GuestSlot;
  values: AssignGuestValues;
  disabled?: boolean;
  onChange: (patch: Partial<AssignGuestValues>) => void;
  onNext: () => void;
  showAddContacts: boolean;
}

function GuestAssignForm({
  slot,
  values,
  disabled,
  onChange,
  onNext,
  showAddContacts,
}: GuestAssignFormProps) {
  const { t } = useTranslation(["admin", "common"]);
  const isLead = slot.kind === "lead";
  const isChild = slot.kind === "child";
  const ageOptions = isChild ? CHILD_AGE_OPTIONS : ADULT_AGE_OPTIONS;

  return (
    <div className="flex w-full flex-col gap-3">
      <SegmentedToggle
        value={values.salutation}
        onValueChange={(salutation) => onChange({ salutation })}
        options={SALUTATION_OPTIONS.map((value) => ({
          value,
          label: t(`itineraries.guestDetails.assign.salutations.${value}`),
        }))}
        disabled={disabled}
      />

      <FieldGroup
        htmlFor={`${slot.id}-first-name`}
        label={t("itineraries.guestDetails.assign.firstName")}
      >
        <Input
          id={`${slot.id}-first-name`}
          value={values.firstName}
          onChange={(event) => onChange({ firstName: event.target.value })}
          disabled={disabled}
          className="h-9 rounded-[6px] bg-background-primary"
        />
      </FieldGroup>

      <FieldGroup
        htmlFor={`${slot.id}-last-name`}
        label={t("itineraries.guestDetails.assign.lastName")}
      >
        <Input
          id={`${slot.id}-last-name`}
          value={values.lastName}
          onChange={(event) => onChange({ lastName: event.target.value })}
          disabled={disabled}
          className="h-9 rounded-[6px] bg-background-primary"
        />
      </FieldGroup>

      {isLead ? (
        <FieldGroup
          label={t("itineraries.guestDetails.assign.dateOfBirth")}
          labelElementId={`${slot.id}-dob-label`}
        >
          <DatePickerGridInput
            value={values.dateOfBirth}
            onChange={(date) => onChange({ dateOfBirth: date })}
            placeholder={t("placeholders.selectStartDate")}
            disabled={disabled}
            className="h-9 rounded-[6px] bg-background-primary"
            aria-labelledby={`${slot.id}-dob-label`}
          />
        </FieldGroup>
      ) : (
        <>
          {!isChild ? (
            <FieldGroup
              htmlFor={`${slot.id}-group`}
              label={t("itineraries.guestDetails.assign.group")}
            >
              <Input
                id={`${slot.id}-group`}
                value={values.group}
                onChange={(event) => onChange({ group: event.target.value })}
                disabled={disabled}
                className="h-9 rounded-[6px] bg-background-primary"
              />
            </FieldGroup>
          ) : null}

          <FieldGroup
            label={t("itineraries.guestDetails.assign.age")}
            error={undefined}
          >
            <Select
              value={values.age}
              onValueChange={(age) => onChange({ age })}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full rounded-[6px] bg-background-primary">
                <SelectValue
                  placeholder={t(
                    "itineraries.guestDetails.manage.agePlaceholder"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {ageOptions.map((age) => (
                  <SelectItem key={age} value={String(age)}>
                    {age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </>
      )}

      {!isChild ? (
        <FieldGroup
          htmlFor={`${slot.id}-flight-details`}
          label={t("itineraries.guestDetails.assign.internationalFlightDetails")}
        >
          <Input
            id={`${slot.id}-flight-details`}
            value={values.internationalFlightDetails}
            onChange={(event) =>
              onChange({ internationalFlightDetails: event.target.value })
            }
            placeholder={t("itineraries.guestDetails.placeholders.typeHere")}
            disabled={disabled}
            className="h-9 rounded-[6px] bg-white"
          />
        </FieldGroup>
      ) : null}

      {!isChild ? (
        <>
          <FieldGroup
            htmlFor={`${slot.id}-dietary`}
            label={t("itineraries.guestDetails.assign.dietaryRequirements")}
          >
            <Textarea
              id={`${slot.id}-dietary`}
              value={values.dietaryRequirements}
              onChange={(event) =>
                onChange({ dietaryRequirements: event.target.value })
              }
              placeholder={t("itineraries.guestDetails.placeholders.typeHere")}
              disabled={disabled}
              className="min-h-24 resize-y rounded-[6px] bg-white"
            />
          </FieldGroup>

          <FieldGroup
            htmlFor={`${slot.id}-preferences`}
            label={t("itineraries.guestDetails.assign.preferences")}
          >
            <Textarea
              id={`${slot.id}-preferences`}
              value={values.preferences}
              onChange={(event) =>
                onChange({ preferences: event.target.value })
              }
              placeholder={t("itineraries.guestDetails.placeholders.typeHere")}
              disabled={disabled}
              className="min-h-24 resize-y rounded-[6px] bg-white"
            />
          </FieldGroup>
        </>
      ) : null}

      <FieldGroup
        htmlFor={`${slot.id}-note`}
        label={t("itineraries.guestDetails.assign.note")}
      >
        <Textarea
          id={`${slot.id}-note`}
          value={values.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder={t("itineraries.guestDetails.placeholders.typeHere")}
          disabled={disabled}
          className="min-h-24 resize-y rounded-[6px] bg-white"
        />
      </FieldGroup>

      <div
        className={cn(
          "flex w-full items-center pt-1",
          showAddContacts ? "justify-between" : "justify-end"
        )}
      >
        {showAddContacts ? (
          <button
            type="button"
            className="text-sm font-semibold leading-6 text-text-link"
            disabled={disabled}
          >
            {t("itineraries.guestDetails.assign.addContacts")}
          </button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-9 border-brand-red px-4 text-brand-red hover:bg-transparent hover:text-brand-red"
          onClick={onNext}
          disabled={disabled}
        >
          {t("itineraries.guestDetails.assign.next")}
        </Button>
      </div>
    </div>
  );
}

export function AssignGuestsPanel({
  slots,
  guestValues,
  expandedSlotId,
  disabled,
  onExpandedSlotChange,
  onGuestChange,
  onAdvanceToNext,
}: AssignGuestsPanelProps) {
  const { t } = useTranslation("admin");

  if (slots.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        {t("itineraries.guestDetails.assign.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {slots.map((slot, index) => {
        const expanded = expandedSlotId === slot.id;
        const values = guestValues[slot.id];
        if (!values) return null;

        return (
          <div key={slot.id} className="flex flex-col gap-4">
            {index > 0 ? <DashedSeparator /> : null}
            <div className="flex flex-col gap-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => onExpandedSlotChange(expanded ? null : slot.id)}
                aria-expanded={expanded}
              >
                <span className="text-base font-semibold leading-6 text-text-primary">
                  {getSlotLabel(slot, t)}
                </span>
                {expanded ? (
                  <ChevronDown className="size-6 text-text-primary" />
                ) : (
                  <ChevronRight className="size-6 text-text-primary" />
                )}
              </button>

              {expanded ? (
                <GuestAssignForm
                  slot={slot}
                  values={values}
                  disabled={disabled}
                  onChange={(patch) => onGuestChange(slot.id, patch)}
                  onNext={() => onAdvanceToNext(slot.id)}
                  showAddContacts={slot.isLead}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
