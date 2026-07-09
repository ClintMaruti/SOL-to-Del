import { toast } from "@sol/ui";
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@sol/ui";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { buildGuestSlots } from "../model/guestSlots";
import {
  createDefaultAssignGuest,
  createManageGuestsValues,
  type AssignGuestValues,
  type GuestDetailsDrawerProps,
  type GuestDrawerMode,
  type ManageGuestsValues,
} from "../model/types";

import { AssignGuestsPanel } from "./AssignGuestsPanel";
import { DashedSeparator } from "./DashedSeparator";
import { ManageGuestsPanel } from "./ManageGuestsPanel";
import { SegmentedToggle } from "./SegmentedToggle";

type ManageGuestsErrors = {
  adultsCount?: string;
  childrenAgeItems?: string[];
};

function validateManageGuests(values: ManageGuestsValues): ManageGuestsErrors {
  const errors: ManageGuestsErrors = {};
  const adults = parseInt(values.adultsCount || "0", 10);
  const childrenCount = Math.max(
    0,
    parseInt(values.childrenCount || "0", 10) || 0
  );

  if (!Number.isFinite(adults) || adults < 1) {
    errors.adultsCount = "required";
  }

  const childAgeErrors: string[] = [];
  for (let index = 0; index < childrenCount; index += 1) {
    const age = parseInt(values.childrenAges[index] ?? "", 10);
    if (!Number.isFinite(age) || age < 2 || age > 17) {
      childAgeErrors[index] = "required";
    }
  }

  if (childAgeErrors.length > 0) {
    errors.childrenAgeItems = childAgeErrors;
  }

  return errors;
}

export function GuestDetailsDrawer({
  open,
  onOpenChange,
  itinerary,
  onPaxSaved,
}: GuestDetailsDrawerProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [mode, setMode] = useState<GuestDrawerMode>("manage");
  const [manageValues, setManageValues] = useState<ManageGuestsValues>(() =>
    createManageGuestsValues(itinerary)
  );
  const [manageErrors, setManageErrors] = useState<ManageGuestsErrors>({});
  const [assignGuests, setAssignGuests] = useState<
    Record<string, AssignGuestValues>
  >({});
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const guestSlots = useMemo(
    () => buildGuestSlots(itinerary),
    [itinerary]
  );

  useEffect(() => {
    if (!open) return;

    setMode("manage");
    setManageValues(createManageGuestsValues(itinerary));
    setManageErrors({});
    const nextAssignGuests = Object.fromEntries(
      guestSlots.map((slot) => [
        slot.id,
        createDefaultAssignGuest(itinerary, slot),
      ])
    );
    setAssignGuests(nextAssignGuests);
    setExpandedSlotId(guestSlots[0]?.id ?? null);
    setIsSaving(false);
  }, [guestSlots, itinerary, open]);

  const handleChildrenCountChange = (raw: string) => {
    const count = Math.max(0, parseInt(raw || "0", 10) || 0);
    setManageValues((previous) => {
      const ages = [...previous.childrenAges];
      while (ages.length < count) ages.push("");
      return {
        ...previous,
        childrenCount: raw,
        childrenAges: ages.slice(0, count),
      };
    });
    setManageErrors((previous) => ({
      ...previous,
      childrenCount: undefined,
      childrenAgeItems: undefined,
    }));
  };

  const handleManageSave = () => {
    const nextErrors = validateManageGuests(manageValues);
    if (nextErrors.adultsCount || nextErrors.childrenAgeItems?.some(Boolean)) {
      setManageErrors({
        adultsCount: nextErrors.adultsCount
          ? t("itineraries.guestDetails.errors.adultsRequired")
          : undefined,
        childrenAgeItems: nextErrors.childrenAgeItems?.map((error) =>
          error ? t("itineraries.guestDetails.errors.childAgeRequired") : ""
        ),
      });
      return;
    }

    setIsSaving(true);
    const childrenCount = Math.max(
      0,
      parseInt(manageValues.childrenCount || "0", 10) || 0
    );
    onPaxSaved?.({
      adultsCount: parseInt(manageValues.adultsCount, 10),
      childrenCount,
      infantsCount: Math.max(
        0,
        parseInt(manageValues.infantsCount || "0", 10) || 0
      ),
      childrenAges: manageValues.childrenAges
        .slice(0, childrenCount)
        .map((age) => Number(age)),
    });
    toast.success(t("itineraries.guestDetails.saveSuccess"));
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleAssignSave = () => {
    setIsSaving(true);
    toast.success(t("itineraries.guestDetails.saveSuccess"));
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleSave = () => {
    if (mode === "manage") {
      handleManageSave();
      return;
    }
    handleAssignSave();
  };

  const handleAdvanceToNext = (currentSlotId: string) => {
    const currentIndex = guestSlots.findIndex((slot) => slot.id === currentSlotId);
    const nextSlot = guestSlots[currentIndex + 1];
    setExpandedSlotId(nextSlot?.id ?? null);
  };

  const modeOptions = [
    {
      value: "manage" as const,
      label: t("itineraries.guestDetails.modes.manage"),
    },
    {
      value: "assign" as const,
      label: t("itineraries.guestDetails.modes.assign"),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="top-3 right-3 bottom-3 flex h-auto w-[calc(100vw-24px)] max-w-[362px] flex-col gap-0 overflow-hidden rounded-[12px] border border-border-tertiary bg-white p-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)] sm:w-[362px] sm:max-w-[362px]"
      >
        <SheetHeader className="shrink-0 flex-row items-center justify-between gap-3 bg-background-primary px-6 pt-6 pb-4">
          <SheetTitle className="text-lg font-bold leading-7 tracking-[-0.4px] text-text-primary">
            {t("itineraries.guestDetails.title")}
          </SheetTitle>
          <button
            type="button"
            aria-label={t("common:buttons.close")}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] text-text-primary transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </button>
        </SheetHeader>

        <DashedSeparator />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-6">
            <div className="flex flex-col gap-10">
              <SegmentedToggle
                value={mode}
                onValueChange={setMode}
                options={modeOptions}
                disabled={isSaving}
              />

              {mode === "manage" ? (
                <ManageGuestsPanel
                  values={manageValues}
                  errors={manageErrors}
                  disabled={isSaving}
                  onAdultsCountChange={(value) => {
                    setManageValues((previous) => ({
                      ...previous,
                      adultsCount: value,
                    }));
                    setManageErrors((previous) => ({
                      ...previous,
                      adultsCount: undefined,
                    }));
                  }}
                  onChildrenCountChange={handleChildrenCountChange}
                  onInfantsCountChange={(value) =>
                    setManageValues((previous) => ({
                      ...previous,
                      infantsCount: value,
                    }))
                  }
                  onChildAgeChange={(index, value) => {
                    setManageValues((previous) => {
                      const ages = [...previous.childrenAges];
                      ages[index] = value;
                      return { ...previous, childrenAges: ages };
                    });
                    setManageErrors((previous) => {
                      const items = [...(previous.childrenAgeItems ?? [])];
                      items[index] = undefined;
                      return { ...previous, childrenAgeItems: items };
                    });
                  }}
                />
              ) : (
                <AssignGuestsPanel
                  slots={guestSlots}
                  guestValues={assignGuests}
                  expandedSlotId={expandedSlotId}
                  disabled={isSaving}
                  onExpandedSlotChange={setExpandedSlotId}
                  onGuestChange={(slotId, patch) =>
                    setAssignGuests((previous) => ({
                      ...previous,
                      [slotId]: {
                        ...previous[slotId]!,
                        ...patch,
                      },
                    }))
                  }
                  onAdvanceToNext={handleAdvanceToNext}
                />
              )}
            </div>
          </div>

          <DashedSeparator />

          <SheetFooter className="shrink-0 flex-row items-center justify-end gap-4 bg-background-primary px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              className="h-9"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-9"
              isLoading={isSaving}
              onClick={handleSave}
            >
              {t("common:buttons.save")}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
