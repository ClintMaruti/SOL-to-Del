import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sol/ui";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DestinationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DestinationSearchInput({
  value,
  onChange,
  placeholder,
}: DestinationSearchInputProps) {
  const { t } = useTranslation("admin");
  const effectivePlaceholder =
    placeholder ?? t("placeholders.searchDestination");
  return (
    <div className="relative mb-4">
      <InputGroup className="bg-background">
        <InputGroupInput
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={effectivePlaceholder}
          className="text-brand-primary font-medium px-1.5! placeholder:font-medium! placeholder:text-sm! placeholder:text-neutral-400!"
        />
        <InputGroupAddon>
          <Search className="h-4 w-4 text-brand-border-primary pointer-events-none z-10" />
        </InputGroupAddon>
        {value.trim() ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => onChange("")}>
              <X className="h-2 w-2 text-brand-border-primary pointer-events-none z-10" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  );
}
