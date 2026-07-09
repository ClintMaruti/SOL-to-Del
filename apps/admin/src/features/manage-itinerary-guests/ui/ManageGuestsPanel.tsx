import {
  FieldGroup,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import { DashedSeparator } from "./DashedSeparator";

const CHILD_AGE_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 2);

export interface ManageGuestsPanelProps {
  values: {
    adultsCount: string;
    childrenCount: string;
    infantsCount: string;
    childrenAges: string[];
  };
  errors: {
    adultsCount?: string;
    childrenAgeItems?: string[];
  };
  disabled?: boolean;
  onAdultsCountChange: (value: string) => void;
  onChildrenCountChange: (value: string) => void;
  onInfantsCountChange: (value: string) => void;
  onChildAgeChange: (index: number, value: string) => void;
}

export function ManageGuestsPanel({
  values,
  errors,
  disabled,
  onAdultsCountChange,
  onChildrenCountChange,
  onInfantsCountChange,
  onChildAgeChange,
}: ManageGuestsPanelProps) {
  const { t } = useTranslation("admin");
  const childrenCount = Math.max(
    0,
    parseInt(values.childrenCount || "0", 10) || 0
  );

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup
        htmlFor="guest-drawer-adults"
        label={t("itineraries.guestDetails.manage.adults")}
        required
        error={errors.adultsCount}
      >
        <Input
          id="guest-drawer-adults"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={values.adultsCount}
          onChange={(event) => onAdultsCountChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.adultsCount)}
          className="h-9 rounded-[6px] bg-background-primary"
        />
      </FieldGroup>

      <DashedSeparator />

      <div className="flex flex-col gap-3">
        <FieldGroup
          htmlFor="guest-drawer-children"
          label={t("itineraries.guestDetails.manage.children")}
        >
          <Input
            id="guest-drawer-children"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.childrenCount}
            onChange={(event) => onChildrenCountChange(event.target.value)}
            disabled={disabled}
            className="h-9 rounded-[6px] bg-background-primary"
          />
        </FieldGroup>

        {childrenCount > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold leading-5 text-text-primary">
              {t("itineraries.guestDetails.manage.childrenAge")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: childrenCount }, (_, index) => (
                <FieldGroup
                  key={index}
                  label={t("itineraries.guestDetails.manage.childLabel", {
                    number: index + 1,
                  })}
                  error={errors.childrenAgeItems?.[index]}
                >
                  <Select
                    value={values.childrenAges[index] ?? ""}
                    onValueChange={(value) => onChildAgeChange(index, value)}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 w-full rounded-[6px] bg-background-primary",
                        errors.childrenAgeItems?.[index] && "border-destructive"
                      )}
                    >
                      <SelectValue
                        placeholder={t(
                          "itineraries.guestDetails.manage.agePlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {CHILD_AGE_OPTIONS.map((age) => (
                        <SelectItem key={age} value={String(age)}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <DashedSeparator />

      <FieldGroup
        htmlFor="guest-drawer-infants"
        label={t("itineraries.guestDetails.manage.infants")}
      >
        <Input
          id="guest-drawer-infants"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={values.infantsCount}
          onChange={(event) => onInfantsCountChange(event.target.value)}
          placeholder={t("itineraries.guestDetails.placeholders.typeHere")}
          disabled={disabled}
          className="h-9 rounded-[6px] bg-white"
        />
      </FieldGroup>
    </div>
  );
}
