import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sol/ui";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  const { t } = useTranslation("admin");
  const effectivePlaceholder = placeholder ?? t("placeholders.search");
  return (
    <div className="relative mb-4">
      <InputGroup className="bg-background">
        <InputGroupInput
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={effectivePlaceholder}
          className="text-brand-primary font-medium px-1.5!"
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
