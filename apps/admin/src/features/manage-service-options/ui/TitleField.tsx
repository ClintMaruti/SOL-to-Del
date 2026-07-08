import { Input } from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { AnyFormApi } from "@/shared/ui/form";
import { FormField } from "@/shared/ui/form";
import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

import type { OptionFormFieldErrors } from "../model/apiValidationErrors";

interface TitleFieldProps {
  form: AnyFormApi;
  htmlIdPrefix: string;
  label?: string;
  fieldError?: string;
  onFieldChange?: (field: keyof OptionFormFieldErrors) => void;
  inputClassName?: string;
}

export function TitleField({
  form,
  htmlIdPrefix,
  label,
  fieldError,
  onFieldChange,
  inputClassName,
}: TitleFieldProps) {
  const { t } = useTranslation("admin");
  const fieldLabel = label ?? t("labels.optionTitle");

  return (
    <FormField
      form={form}
      name="title"
      label={fieldLabel}
      htmlIdPrefix={htmlIdPrefix}
      required
      error={fieldError}
      validators={{
        onSubmit: ({ value }: { value: string }) => {
          const trimmed = value.trim();
          if (!trimmed) return VALIDATION_MESSAGES.required(fieldLabel);
          if (trimmed.length < 2)
            return t("validation.fieldMinLength", {
              field: fieldLabel,
              min: 2,
            });
          if (trimmed.length > 200)
            return t("validation.fieldMaxLength", {
              field: fieldLabel,
              max: 200,
            });
          return undefined;
        },
      }}
    >
      {(field) => (
        <Input
          value={field.state.value}
          onChange={(e) => {
            onFieldChange?.("title");
            field.handleChange(e.target.value);
          }}
          onBlur={field.handleBlur}
          placeholder={t("placeholders.enterOptionTitle")}
          className={inputClassName}
        />
      )}
    </FormField>
  );
}
