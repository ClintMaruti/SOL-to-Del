import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Label,
  Textarea,
} from "@sol/ui";

export interface EntityNotesFieldProps {
  id: string;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  "aria-invalid"?: boolean;
}

/**
 * Plain-text notes field: grows with content, no inner scroll (page scrolls),
 * whitespace preserved. Shared pattern for agency/service/supplier notes.
 */
export function EntityNotesField({
  id,
  title,
  description,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  "aria-invalid": ariaInvalid,
}: EntityNotesFieldProps) {
  return (
    <Card className="rounded-[6px] shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Textarea
            id={id}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-[120px]",
              error && "border-destructive"
            )}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
