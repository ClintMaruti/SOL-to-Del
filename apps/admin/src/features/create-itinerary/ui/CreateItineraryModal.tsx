import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FieldGroup,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@sol/ui";
import { useMemo, useState, type FormEvent } from "react";

import { useAgencies } from "@/entities/agency";
import { useAgents } from "@/entities/agent";
import {
  useCreateItinerary,
  type ItineraryListItem,
} from "@/entities/itinerary";
import { DatePickerGridInput } from "@/shared/ui";

import { isCreateItineraryAgentActive } from "../model/agentStatus";

import { AgencyAgentSelect } from "./AgencyAgentSelect";

type Mode = "new" | "existing";

interface FormValues {
  mode: Mode;
  inquiryId: string;
  title: string;
  agencySelection: string;
  leadTravelerFirstName: string;
  leadTravelerLastName: string;
  travelDateFrom: string;
  travelDateTo: string;
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
  childrenAges: string[];
}

interface FieldErrors {
  inquiryId?: string;
  agencySelection?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  adultsCount?: string;
  childrenAgeItems?: Record<number, string>;
}

const INITIAL: FormValues = {
  mode: "new",
  inquiryId: "",
  title: "",
  agencySelection: "",
  leadTravelerFirstName: "",
  leadTravelerLastName: "",
  travelDateFrom: "",
  travelDateTo: "",
  adultsCount: "1",
  childrenCount: "",
  infantsCount: "",
  childrenAges: [],
};

const MOCK_INQUIRIES = [
  {
    id: "inq-1",
    reference: "CPS26000201",
    agencyId: "agency-1",
    agentId: null,
  },
  {
    id: "inq-2",
    reference: "CPS26000202",
    agencyId: "agency-2",
    agentId: "agent-2",
  },
  {
    id: "inq-3",
    reference: "CPS26000203",
    agencyId: "agency-3",
    agentId: "agent-3",
  },
  {
    id: "inq-4",
    reference: "CPS26000204",
    agencyId: "agency-1",
    agentId: null,
  },
  {
    id: "inq-5",
    reference: "CPS26000205",
    agencyId: "agency-2",
    agentId: "agent-2",
  },
];

const AGENT_PREFIX = "agent:";
const AGENCY_PREFIX = "agency:";

function parseSelection(value: string) {
  if (value.startsWith(AGENT_PREFIX))
    return { agencyId: null, agentId: value.slice(AGENT_PREFIX.length) };
  if (value.startsWith(AGENCY_PREFIX))
    return { agencyId: value.slice(AGENCY_PREFIX.length), agentId: null };
  return { agencyId: null, agentId: null };
}

function selectionFromIds(
  agencyId: string | null,
  agentId: string | null
): string {
  if (agentId) return `${AGENT_PREFIX}${agentId}`;
  if (agencyId) return `${AGENCY_PREFIX}${agencyId}`;
  return "";
}

export interface CopySource {
  reference: string;
  agencyId: string | null;
  agentId: string | null;
  title: string | null;
  leadTravelerFirstName?: string;
  leadTravelerLastName?: string;
  travelDateFrom: string;
  travelDateTo: string | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  childrenAges: number[];
}

interface CreateItineraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (itinerary: ItineraryListItem) => void;
  copySource?: CopySource;
}

export function CreateItineraryModal({
  open,
  onOpenChange,
  onSuccess,
  copySource,
}: CreateItineraryModalProps) {
  const isCopy = Boolean(copySource);

  const { data: agencies = [], isLoading: isLoadingAgencies } = useAgencies();
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const {
    mutate: createItinerary,
    isPending,
    reset: resetMutation,
  } = useCreateItinerary();

  const activeAgencyIds = useMemo(
    () => new Set(agencies.filter((a) => a.isActive).map((a) => a.id)),
    [agencies]
  );
  const activeAgentAgencyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      if (
        isCreateItineraryAgentActive(agent) &&
        activeAgencyIds.has(agent.agencyId)
      ) {
        map.set(agent.id, agent.agencyId);
      }
    }
    return map;
  }, [agents, activeAgencyIds]);

  const isCatalogLoading = isLoadingAgencies || isLoadingAgents;

  const getInitialValues = (): FormValues => {
    if (copySource) {
      return {
        ...INITIAL,
        agencySelection: selectionFromIds(
          copySource.agencyId,
          copySource.agentId
        ),
        title: copySource.title ? `${copySource.title} — Copy` : "",
        leadTravelerFirstName: copySource.leadTravelerFirstName ?? "",
        leadTravelerLastName: copySource.leadTravelerLastName ?? "",
        travelDateFrom: copySource.travelDateFrom,
        travelDateTo: copySource.travelDateTo ?? "",
        adultsCount: String(copySource.adultsCount),
        childrenCount: String(copySource.childrenCount),
        infantsCount: String(copySource.infantsCount),
        childrenAges: copySource.childrenAges.map(String),
      };
    }
    return { ...INITIAL };
  };

  const [values, setValues] = useState<FormValues>(getInitialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [inquirySearch, setInquirySearch] = useState("");

  const childrenCount = Math.max(
    0,
    parseInt(values.childrenCount || "0", 10) || 0
  );

  const filteredInquiries = useMemo(
    () =>
      MOCK_INQUIRIES.filter(
        (inq) =>
          !inquirySearch ||
          inq.reference.toLowerCase().includes(inquirySearch.toLowerCase())
      ),
    [inquirySearch]
  );

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const updateChildrenCount = (raw: string) => {
    const count = Math.max(0, parseInt(raw || "0", 10) || 0);
    setValues((prev) => {
      const ages = [...prev.childrenAges];
      while (ages.length < count) ages.push("");
      return {
        ...prev,
        childrenCount: raw,
        childrenAges: ages.slice(0, count),
      };
    });
    setErrors((prev) => ({ ...prev, childrenCount: undefined }));
  };

  const updateChildAge = (index: number, val: string) => {
    setErrors((prev) => {
      const items = { ...(prev.childrenAgeItems ?? {}) };
      delete items[index];
      return { ...prev, childrenAgeItems: items };
    });
    setValues((prev) => {
      const ages = [...prev.childrenAges];
      ages[index] = val;
      return { ...prev, childrenAges: ages };
    });
  };

  const switchMode = (mode: Mode) => {
    setValues((prev) => ({ ...prev, mode, inquiryId: "" }));
    setErrors((prev) => ({ ...prev, inquiryId: undefined }));
    setInquirySearch("");
  };

  const selectInquiry = (inqId: string) => {
    const inq = MOCK_INQUIRIES.find((i) => i.id === inqId);
    setErrors((prev) => ({
      ...prev,
      inquiryId: undefined,
      agencySelection: undefined,
    }));
    setValues((prev) => ({
      ...prev,
      inquiryId: inqId,
      agencySelection: inq
        ? selectionFromIds(inq.agencyId, inq.agentId)
        : prev.agencySelection,
    }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (values.mode === "existing" && !values.inquiryId) {
      next.inquiryId = "Please select an existing inquiry.";
    }

    const { agencyId, agentId } = parseSelection(values.agencySelection);
    if (!agencyId && !agentId) {
      next.agencySelection = "Agency is required.";
    } else if (agencyId && !activeAgencyIds.has(agencyId)) {
      next.agencySelection =
        "The selected agency is not available. Please choose an active agency.";
    } else if (agentId && !activeAgentAgencyById.has(agentId)) {
      next.agencySelection =
        "The selected agency is not available. Please choose an active agency.";
    }

    if (!values.travelDateFrom) {
      next.travelDateFrom = "Start date is required.";
    } else if (!isCopy) {
      const today = new Date().toISOString().slice(0, 10);
      if (values.travelDateFrom < today) {
        next.travelDateFrom = "Start date cannot be in the past.";
      }
    }

    if (
      values.travelDateTo &&
      values.travelDateFrom &&
      values.travelDateTo < values.travelDateFrom
    ) {
      next.travelDateTo = "End date must be on or after the start date.";
    }

    const adults = parseInt(values.adultsCount || "0", 10);
    if (isNaN(adults) || adults < 1) {
      next.adultsCount = "At least one adult is required.";
    }

    const ageErrors: Record<number, string> = {};
    for (let i = 0; i < childrenCount; i++) {
      const age = parseInt(values.childrenAges[i] ?? "", 10);
      if (isNaN(age) || age < 2 || age > 17) {
        ageErrors[i] = `Please enter a valid age (2–17) for Child ${i + 1}.`;
      }
    }
    if (Object.keys(ageErrors).length > 0) {
      next.childrenAgeItems = ageErrors;
    }

    setErrors(next);
    const topLevelErrors = Object.entries(next).filter(
      ([k, v]) => k !== "childrenAgeItems" && v
    );
    return topLevelErrors.length === 0 && !next.childrenAgeItems;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate()) return;

    const { agencyId, agentId } = parseSelection(values.agencySelection);
    const resolvedAgencyId =
      agencyId ?? (agentId ? (activeAgentAgencyById.get(agentId) ?? "") : "");

    createItinerary(
      {
        mode: values.mode,
        inquiryId: values.mode === "existing" ? values.inquiryId : undefined,
        title: values.title.trim() || undefined,
        agencyId: resolvedAgencyId,
        agentId,
        leadTravelerFirstName: values.leadTravelerFirstName.trim() || undefined,
        leadTravelerLastName: values.leadTravelerLastName.trim() || undefined,
        travelDateFrom: values.travelDateFrom,
        travelDateTo: values.travelDateTo || undefined,
        adultsCount: parseInt(values.adultsCount, 10),
        childrenCount,
        infantsCount: parseInt(values.infantsCount || "0", 10),
        childrenAges: values.childrenAges.slice(0, childrenCount).map(Number),
      },
      {
        onSuccess: (itinerary) => {
          setValues(getInitialValues());
          setErrors({});
          resetMutation();
          toast.success("Itinerary created successfully.");
          onSuccess(itinerary);
        },
        onError: (error) => {
          const validation = getValidationErrors(error);
          if (validation) {
            const fieldErrors: FieldErrors = {};
            for (const [field, msgs] of Object.entries(validation.errors)) {
              const msg = (msgs as string[])[0];
              if (!msg) continue;
              const f = field.toLowerCase();
              if (f.includes("agency") || f.includes("agent"))
                fieldErrors.agencySelection = msg;
              else if (f.includes("datefrom")) fieldErrors.travelDateFrom = msg;
              else if (f.includes("dateto")) fieldErrors.travelDateTo = msg;
              else if (f.includes("adults")) fieldErrors.adultsCount = msg;
            }
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
              return;
            }
          }
          toast.error(
            getErrorMessage(error, "Something went wrong. Please try again.")
          );
        },
      }
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValues(getInitialValues());
      setErrors({});
      resetMutation();
      setInquirySearch("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[552px]! gap-0 rounded-[12px] border-black/10 p-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <DialogTitle className="text-lg font-bold text-neutral-900">
            {isCopy ? "Copy Itinerary" : "Create Itinerary"}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            Create a new itinerary or add to an existing inquiry
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="px-6 pt-4">
          <div className="flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
            {(["new", "existing"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                  values.mode === m
                    ? "bg-[#8B1515] text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                {m === "new" ? "New" : "Existing"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
          {/* Inquiry + Agency */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              label="Inquiry"
              error={errors.inquiryId}
              required={values.mode === "existing"}
            >
              {values.mode === "new" ? (
                <div className="flex h-9 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400 italic select-none">
                  System will assign
                </div>
              ) : (
                <Select value={values.inquiryId} onValueChange={selectInquiry}>
                  <SelectTrigger
                    className={cn(
                      "w-full",
                      errors.inquiryId && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select Inquiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-1">
                      <Input
                        placeholder="Search..."
                        value={inquirySearch}
                        onChange={(e) => setInquirySearch(e.target.value)}
                        className="h-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {filteredInquiries.map((inq) => (
                      <SelectItem key={inq.id} value={inq.id}>
                        {inq.reference}
                      </SelectItem>
                    ))}
                    {filteredInquiries.length === 0 && (
                      <p className="px-3 py-2 text-sm text-neutral-400">
                        No results
                      </p>
                    )}
                  </SelectContent>
                </Select>
              )}
            </FieldGroup>

            <FieldGroup
              htmlFor="create-agency"
              label="Agency"
              error={errors.agencySelection}
              required
            >
              <AgencyAgentSelect
                agencies={agencies}
                agents={agents}
                id="create-agency"
                value={values.agencySelection}
                onValueChange={(v) => updateField("agencySelection", v)}
                disabled={isPending || isCatalogLoading}
                hasError={Boolean(errors.agencySelection)}
              />
            </FieldGroup>
          </div>

          {/* Copy source note */}
          {isCopy && copySource && (
            <p className="text-xs text-neutral-400 -mt-1">
              Copying from:{" "}
              <span className="font-medium text-neutral-600">
                {copySource.reference}
              </span>
            </p>
          )}

          {/* Title */}
          <FieldGroup htmlFor="create-title" label="Itinerary Title">
            <Input
              id="create-title"
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Type here"
              maxLength={255}
              disabled={isPending}
            />
          </FieldGroup>

          {/* Lead Traveler */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              htmlFor="create-first-name"
              label="Lead Traveler First Name"
            >
              <Input
                id="create-first-name"
                value={values.leadTravelerFirstName}
                onChange={(e) =>
                  updateField("leadTravelerFirstName", e.target.value)
                }
                placeholder="Type here"
                maxLength={255}
                disabled={isPending}
              />
            </FieldGroup>
            <FieldGroup htmlFor="create-last-name" label="Last Name">
              <Input
                id="create-last-name"
                value={values.leadTravelerLastName}
                onChange={(e) =>
                  updateField("leadTravelerLastName", e.target.value)
                }
                placeholder="Type here"
                maxLength={255}
                disabled={isPending}
              />
            </FieldGroup>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              label="Date From"
              error={errors.travelDateFrom}
              required
            >
              <DatePickerGridInput
                id="create-date-from"
                value={values.travelDateFrom}
                onChange={(date) => updateField("travelDateFrom", date)}
                placeholder="Select date"
                hasError={Boolean(errors.travelDateFrom)}
                disabled={isPending}
                className="bg-white"
              />
            </FieldGroup>
            <FieldGroup label="Date To" error={errors.travelDateTo}>
              <DatePickerGridInput
                id="create-date-to"
                value={values.travelDateTo}
                onChange={(date) => updateField("travelDateTo", date)}
                placeholder="Select date"
                hasError={Boolean(errors.travelDateTo)}
                disabled={isPending}
                className="bg-white"
              />
            </FieldGroup>
          </div>

          {/* Pax */}
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup
              htmlFor="create-adults"
              label="Adults (18+ y.o.)"
              error={errors.adultsCount}
              required
            >
              <Input
                id="create-adults"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={values.adultsCount}
                onChange={(e) => updateField("adultsCount", e.target.value)}
                placeholder="1"
                aria-invalid={Boolean(errors.adultsCount)}
                disabled={isPending}
              />
            </FieldGroup>
            <FieldGroup htmlFor="create-children" label="Children (2-17 y.o.)">
              <Input
                id="create-children"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.childrenCount}
                onChange={(e) => updateChildrenCount(e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
            </FieldGroup>
            <FieldGroup htmlFor="create-infants" label="Infants (0-1 y.o.)">
              <Input
                id="create-infants"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.infantsCount}
                onChange={(e) => updateField("infantsCount", e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
            </FieldGroup>
          </div>

          {/* Children Ages — conditional */}
          {childrenCount > 0 && (
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 space-y-2">
              <p className="text-sm font-medium text-neutral-700">
                Children Age
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: childrenCount }, (_, i) => (
                  <FieldGroup
                    key={i}
                    label={`Child ${i + 1}`}
                    error={errors.childrenAgeItems?.[i]}
                  >
                    <Select
                      value={values.childrenAges[i] ?? ""}
                      onValueChange={(val) => updateChildAge(i, val)}
                      disabled={isPending}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full",
                          errors.childrenAgeItems?.[i] && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Age" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 16 }, (_, n) => n + 2).map(
                          (age) => (
                            <SelectItem key={age} value={String(age)}>
                              {age}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {isCopy ? "Create Copy" : "Create Itinerary"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
