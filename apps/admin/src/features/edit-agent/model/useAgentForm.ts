import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useRef, useState } from "react";

import type { UpdateAgentRequest } from "@/entities/agent/model/api-types";
import type { Agent, AgentStatus } from "@/entities/agent/model/types";
import { toCatalogNoteDtoForApi } from "@/entities/catalog-extra";
import type { CreateAgentFormData } from "@/features/create-agent/model/types";
import { useValueBasedDirty } from "@/shared/hooks";
import { formDataEqual } from "@/shared/lib/form";
import { validatePhone } from "@/shared/lib/validation";

/**
 * Shared agent form data for both create and edit.
 * Create mode: agencyId is required and user-selectable; language, currency, status have defaults.
 */
export interface AgentFormData {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  alternateEmail: string;
  phone: string;
  agencyId: string;
  assignedSafariPlannerId: string;
  assignedSafariPlannerName: string;
  language: string;
  notes: string;
  currency: string;
  status: AgentStatus;
}

export interface AgentFormErrors {
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  alternateEmail?: string;
  phone?: string;
  agencyId?: string;
  assignedSafariPlannerId?: string;
  notes?: string;
}

/** Max lengths aligned with POST /api/catalog/agents (CreateAgentRequest) */
const MAX_FIRST_NAME = 50;
const MAX_LAST_NAME = 50;
const MAX_EMAIL = 64;

export const INITIAL_FORM_DATA: CreateAgentFormData = {
  firstName: "",
  lastName: "",
  agencyId: "",
  assignedSafariPlannerId: "",
  assignedSafariPlannerName: "",
  primaryEmail: "",
  phone: "",
  alternateEmail: "",
  notes: "",
};

const AGENT_FORM_KEYS = [
  "firstName",
  "lastName",
  "primaryEmail",
  "alternateEmail",
  "phone",
  "agencyId",
  "assignedSafariPlannerId",
  "assignedSafariPlannerName",
  "language",
  "notes",
  "currency",
  "status",
] as const;

export function getInitialFormData(agent?: Agent | null): AgentFormData {
  if (!agent) {
    return {
      firstName: "",
      lastName: "",
      primaryEmail: "",
      alternateEmail: "",
      phone: "",
      agencyId: "",
      assignedSafariPlannerId: "",
      assignedSafariPlannerName: "",
      language: "",
      notes: "",
      currency: "",
      status: "Active",
    };
  }

  return {
    firstName: agent.firstName || "",
    lastName: agent.lastName || "",
    primaryEmail: agent.primaryEmail || "",
    alternateEmail: agent.alternateEmail || "",
    phone: agent.phoneNumber || "",
    agencyId: agent.agencyId || "",
    assignedSafariPlannerId: agent.assignedSafariPlannerId ?? "",
    assignedSafariPlannerName: agent.assignedSafariPlannerName ?? "",
    language: agent.language || "",
    notes: agent.notes?.text ?? "",
    currency: agent.currency || "",
    status: agent.isActive ? "Active" : "Inactive",
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_AGENT_FORM_DATA = getInitialFormData(null);

export function useAgentForm(agent?: Agent | null) {
  const initialData = getInitialFormData(agent);
  const prevAgentIdRef = useRef<string | null>(agent?.id ?? null);
  const prevInitialDataRef = useRef<AgentFormData | null | undefined>(
    initialData
  );
  const [formData, setFormData] = useState<AgentFormData>(() =>
    getInitialFormData(agent)
  );
  const formDataRef = useRef<AgentFormData>(formData);
  const [errors, setErrors] = useState<AgentFormErrors>({});

  const form = useForm({
    defaultValues: agent ? getInitialFormData(agent) : EMPTY_AGENT_FORM_DATA,
  });

  const {
    isDirty,
    reset: resetDirty,
    setBaseline,
    setHasSeenFormMatchingInitial,
  } = useValueBasedDirty<AgentFormData>(
    formData,
    agent != null ? initialData : null,
    AGENT_FORM_KEYS,
    EMPTY_AGENT_FORM_DATA
  );

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Sync when agent *value* or agent id changes (for edit mode). Value-based check
  // avoids infinite loops when the parent passes a new object reference every render.
  // Agent id check ensures we reset when switching to a different agent.
  useEffect(() => {
    if (!agent) return;
    const nextInitialData = getInitialFormData(agent);
    const prev = prevInitialDataRef.current;
    const agentIdChanged = agent.id !== prevAgentIdRef.current;
    const dataChanged =
      agentIdChanged ||
      prev == null ||
      !formDataEqual(prev, nextInitialData, AGENT_FORM_KEYS);
    if (dataChanged) {
      prevAgentIdRef.current = agent.id;
      prevInitialDataRef.current = nextInitialData;
      formDataRef.current = nextInitialData;
      form.reset(nextInitialData);
      queueMicrotask(() => {
        setFormData(nextInitialData);
        setErrors({});
        setHasSeenFormMatchingInitial(false);
        setBaseline({ ...nextInitialData });
      });
    }
  }, [agent, form, setBaseline, setHasSeenFormMatchingInitial]);

  const updateField = <K extends keyof AgentFormData>(
    field: K,
    value: AgentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    formDataRef.current = { ...formDataRef.current, [field]: value };
    setErrors((prev) => {
      if (prev[field as keyof AgentFormErrors]) {
        const next = { ...prev };
        delete next[field as keyof AgentFormErrors];
        return next;
      }
      return prev;
    });
  };

  const validate = (): { valid: boolean; errors: AgentFormErrors } => {
    const current = formDataRef.current;
    const newErrors: AgentFormErrors = {};

    if (!current.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (current.firstName.length > MAX_FIRST_NAME) {
      newErrors.firstName = `First name must be at most ${MAX_FIRST_NAME} characters`;
    }

    if (!current.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (current.lastName.length > MAX_LAST_NAME) {
      newErrors.lastName = `Last name must be at most ${MAX_LAST_NAME} characters`;
    }

    if (!current.primaryEmail.trim()) {
      newErrors.primaryEmail = agent
        ? "Primary email is required"
        : "Email is required";
    } else if (!EMAIL_REGEX.test(current.primaryEmail.trim())) {
      newErrors.primaryEmail = "Please enter a valid email address";
    } else if (current.primaryEmail.length > MAX_EMAIL) {
      newErrors.primaryEmail = `Email must be at most ${MAX_EMAIL} characters`;
    }

    if (current.alternateEmail.trim()) {
      if (!EMAIL_REGEX.test(current.alternateEmail.trim())) {
        newErrors.alternateEmail = "Please enter a valid email address";
      } else if (current.alternateEmail.length > MAX_EMAIL) {
        newErrors.alternateEmail = `Alternate email must be at most ${MAX_EMAIL} characters`;
      }
    }

    const phoneError = validatePhone(current.phone, {
      required: "Phone number is required",
      format: "Enter a valid international number, e.g. +254 712 345 678",
    });
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    // Create mode: require agencyId
    if (!agent && !current.agencyId.trim()) {
      newErrors.agencyId = "Agency is required";
    }

    if (!current.assignedSafariPlannerId.trim()) {
      newErrors.assignedSafariPlannerId = agent
        ? "Assigned Safari Planner is required"
        : "Assigned SP is required";
    }

    setErrors(newErrors);
    return {
      valid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const reset = useCallback(
    (nextInitial?: AgentFormData | null) => {
      const next = nextInitial ?? getInitialFormData(agent);
      resetDirty(next);
      formDataRef.current = next;
      setFormData(next);
      setErrors({});
      form.reset(next);
    },
    [agent, form, resetDirty, setFormData, setErrors]
  );

  const getSubmitData = (): UpdateAgentRequest | undefined => {
    if (!agent) return undefined;
    const current = formDataRef.current;
    return {
      version: agent.version,
      firstName: current.firstName.trim(),
      lastName: current.lastName.trim(),
      primaryEmail: current.primaryEmail.trim(),
      alternateEmail: current.alternateEmail.trim() || undefined,
      phone: current.phone.trim(),
      agencyId: current.agencyId,
      assignedSafariPlannerId: current.assignedSafariPlannerId.trim(),
      assignedSafariPlannerName: current.assignedSafariPlannerName.trim(),
      language: current.language.trim() || undefined,
      notes: toCatalogNoteDtoForApi(agent.notes, current.notes),
      currency: current.currency.trim() || undefined,
      status: current.status,
    };
  };

  return {
    formData,
    errors,
    updateField,
    validate,
    reset,
    isDirty,
    getSubmitData,
  };
}
