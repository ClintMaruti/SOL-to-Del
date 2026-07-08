import { ApiError, getErrorMessage } from "@sol/api-client";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  cn,
  Input,
  Label,
  Skeleton,
  toast,
} from "@sol/ui";
import { CheckCheck, CircleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useFutureUpliftConfig,
  useUpdateFutureUplift,
  validateFutureUpliftInput,
} from "@/features/update-future-uplift";

function sanitizePercentInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) {
    return cleaned;
  }
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function FutureUpliftSettingsCard() {
  const { t } = useTranslation(["admin", "common"]);
  const { data, isLoading, isError, error, refetch } = useFutureUpliftConfig();
  const updateMutation = useUpdateFutureUplift();

  /** Local override while the user edits; `null` means "track server data" (no useEffect sync). */
  const [draft, setDraft] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  /** True after a successful save until the user edits again (Figma “Saved” button state). */
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  const serverStr = useMemo(() => {
    if (
      data?.futureUpliftPercent === null ||
      data?.futureUpliftPercent === undefined
    ) {
      return "";
    }
    return String(data.futureUpliftPercent);
  }, [data?.futureUpliftPercent]);

  const value = draft !== null ? draft : serverStr;

  const validationError = validateFutureUpliftInput(value);
  const sameAsServer =
    value.trim() === serverStr || (value === "" && serverStr === "");
  const saveDisabled =
    updateMutation.isPending ||
    isLoading ||
    data === undefined ||
    validationError !== undefined ||
    sameAsServer;

  const isSavedButtonState =
    showSavedConfirmation && sameAsServer && !updateMutation.isPending;

  const handleSave = () => {
    if (data === undefined || isLoading || updateMutation.isPending) {
      return;
    }

    const err = validateFutureUpliftInput(value);
    if (err) {
      setFieldError(err);
      return;
    }

    if (sameAsServer) {
      return;
    }

    const n = Number(value.trim());
    updateMutation.mutate(
      { futureUpliftPercent: n, version: data.version },
      {
        onSuccess: () => {
          setDraft(null);
          setFieldError(undefined);
          setShowSavedConfirmation(true);
          toast.success(t("modals.futureUpliftSaved"));
        },
        onError: (e) => {
          if (ApiError.isApiError(e) && e.status === 409) {
            toast.error(t("validation.futureUpliftVersionConflict"));
            void refetch();
            return;
          }
          toast.error(
            getErrorMessage(e, t("validation.failedToSaveFutureUplift"))
          );
        },
      }
    );
  };

  if (isError) {
    const is404 = ApiError.isApiError(error) && error.status === 404;
    return (
      <Card className="rounded-[6px] border-0 bg-transparent shadow-none">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">
            {is404
              ? t("validation.futureUpliftSettingsNotFound")
              : t("validation.failedToLoadFutureUplift")}
          </p>
          {!is404 ? (
            <Button
              type="button"
              variant="outline"
              className="mt-2 rounded-[6px]"
              onClick={() => {
                void refetch();
              }}
            >
              {t("common:buttons.tryAgain")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-[6px] border-0 bg-transparent shadow-none">
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-40 rounded-[6px]" />
          <Skeleton className="h-10 w-full max-w-md rounded-[6px]" />
          <Skeleton className="h-9 w-24 rounded-[6px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col rounded-[6px] border-0 bg-transparent shadow-none">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6 md:flex-row md:flex-nowrap md:items-start md:justify-between md:gap-8">
          <form
            id="future-uplift-form"
            className="w-full shrink-0 space-y-2 md:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="flex w-full max-w-md flex-col gap-2">
              <Label
                htmlFor="future-uplift-percent"
                className="font-[var(--Text-M-Semibold-Weight,600)] text-[length:var(--Text-M-Semibold-Size,14px)] leading-[var(--Text-M-Semibold-Line-Height,24px)] tracking-[var(--Text-M-Semibold-Letter-Spacing,0)] text-[var(--Text-Primary,#171717)]"
              >
                {t("labels.futureUpliftPercent")}
              </Label>
              <div className="flex flex-col gap-2">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    id="future-uplift-percent"
                    name="futureUpliftPercent"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={t("placeholders.futureUpliftInput")}
                    value={value}
                    onChange={(e) => {
                      setShowSavedConfirmation(false);
                      const next = sanitizePercentInput(e.target.value);
                      setDraft(next);
                      setFieldError(validateFutureUpliftInput(next));
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") {
                        return;
                      }
                      e.preventDefault();
                      handleSave();
                    }}
                    onBlur={() => {
                      setFieldError(validateFutureUpliftInput(value));
                    }}
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={
                      fieldError ? "future-uplift-error" : undefined
                    }
                    className={cn(
                      "w-full max-w-[260px] rounded-[6px]",
                      value.trim() !== "" && "bg-muted",
                      fieldError && "border-destructive"
                    )}
                  />
                  <Button
                    type="button"
                    variant={isSavedButtonState ? "secondary" : "primary"}
                    className={cn(
                      "h-9 w-full shrink-0 rounded-[6px] sm:w-auto",
                      "inline-flex items-center justify-center gap-2",
                      saveDisabled && "pointer-events-none"
                    )}
                    disabled={saveDisabled}
                    isLoading={updateMutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (saveDisabled) {
                        return;
                      }
                      handleSave();
                    }}
                  >
                    {isSavedButtonState ? (
                      <>
                        <CheckCheck className="size-4 shrink-0" aria-hidden />
                        {t("buttons.saved")}
                      </>
                    ) : (
                      t("common:buttons.save")
                    )}
                  </Button>
                </div>
                {fieldError ? (
                  <p
                    id="future-uplift-error"
                    className="text-sm text-destructive"
                  >
                    {fieldError}
                  </p>
                ) : null}
              </div>
            </div>
          </form>

          <Alert
            variant="info"
            className="w-full max-w-[640px] shrink-0 rounded-[var(--radius-md,6px)] border border-[var(--Text-Info)]/25 bg-[var(--Background-Info-Subtle,#DFF2FE)] [&_[data-slot=alert-icon]]:text-[var(--Text-Info-Bold,#0084d1)]"
          >
            <div className="flex gap-3">
              <CircleAlert
                data-slot="alert-icon"
                className="size-4 shrink-0"
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <AlertTitle className="text-[length:var(--Headings-2XS-Bold-Size,14px)] font-[var(--Headings-2XS-Bold-Weight,700)] leading-[var(--Headings-2XS-Bold-Line-Height,20px)] tracking-[var(--Headings-2XS-Bold-Letter-Spacing,0)] text-[var(--Text-Info-Bold,#0084d1)]">
                  {t("labels.futureUpliftInfoTitle")}
                </AlertTitle>
                <AlertDescription className="text-[length:var(--Text-M-Medium-Size,14px)] font-[350] leading-[var(--Text-M-Medium-Line-Height,24px)] tracking-[var(--Text-M-Medium-Letter-Spacing,0)] text-[var(--Text-Info-Bold,#0084d1)]">
                  {t("labels.futureUpliftInfoBody")}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
