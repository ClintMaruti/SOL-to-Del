import { z } from "zod";

import type {
  CatalogContractedExtraDetail,
  CatalogExtraDetail,
} from "@/entities/catalog-extra";
import { deriveCatalogExtraServiceIds } from "@/entities/catalog-extra/lib/derive-catalog-extra-service-ids";
import {
  tAdmin,
  VALIDATION_MESSAGES,
} from "@/shared/ui/form/validation-messages";

const travelRowSchema = z.object({
  id: z.string(),
  travelFrom: z.string(),
  travelTo: z.string(),
  net: z.string(),
  rack: z.string(),
  sell: z.string(),
});

const notesSchema = z.object({
  id: z.string().nullable(),
  text: z.string(),
  version: z.number(),
});

function hasNonEmptyValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

/**
 * Contracted-extra payload and field-level validation apply only when the user
 * is editing an existing contracted-extra row or has chosen a contract.
 * Other form state (defaults, travel row placeholders, etc.) must not imply
 * a configured contracted extra — extras may exist without any contract.
 */
/** Contracted-extra PUT payload applies only when user selected a contract. */
export function isContractedExtraConfigured(
  contracted: EditExtraFormValues["contracted"]
): boolean {
  return hasNonEmptyValue(contracted.contractId);
}

export function hasContractSelected(
  contracted: EditExtraFormValues["contracted"]
): boolean {
  return hasNonEmptyValue(contracted.contractId);
}

export const editExtraSubmitSchema = z.object({
  title: z.string().superRefine((val, ctx) => {
    if (val.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: VALIDATION_MESSAGES.required("Title"),
      });
    }
  }),
  /** Optional linkage shortcut on supplier-level extras (BR-3). */
  serviceIds: z.array(z.string()).optional().default([]),
  description: z.string(),
  notes: notesSchema,
  contracted: z
    .object({
      contractedExtraId: z.string().nullable(),
      contractedExtraVersion: z.number().nullable(),
      contractId: z.string(),
      validFrom: z.string(),
      validTo: z.string(),
      extraRequirement: z.enum(["mandatory", "optional"]),
      chargeType: z.enum(["person", "unit"]),
      timeUnit: z.enum(["night", "day", "stay"]),
      travelDates: z.array(travelRowSchema),
    })
    .superRefine((contracted, ctx) => {
      if (!isContractedExtraConfigured(contracted)) return;

      if (!hasNonEmptyValue(contracted.contractId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contractId"],
          message: VALIDATION_MESSAGES.required(
            tAdmin("extraDetail.labels.contract")
          ),
        });
      }

      if (!hasNonEmptyValue(contracted.validFrom)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["validFrom"],
          message: VALIDATION_MESSAGES.required(
            tAdmin("extraDetail.labels.validFrom")
          ),
        });
      }

      if (!hasNonEmptyValue(contracted.validTo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["validTo"],
          message: VALIDATION_MESSAGES.required(
            tAdmin("extraDetail.labels.validTo")
          ),
        });
      }

      if (contracted.travelDates.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["travelDates"],
          message: tAdmin("validation.travelDatesCannotBeEmpty"),
        });
      }

      contracted.travelDates.forEach((row, index) => {
        if (!hasNonEmptyValue(row.travelFrom)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["travelDates", index, "travelFrom"],
            message: tAdmin("validation.travelDateFromRequired"),
          });
        }
        if (!hasNonEmptyValue(row.travelTo)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["travelDates", index, "travelTo"],
            message: tAdmin("validation.travelDateToRequired"),
          });
        }
      });
    }),
});

export type EditExtraSubmitValues = z.infer<typeof editExtraSubmitSchema>;

export interface EditExtraFormValues {
  title: string;
  serviceIds: string[];
  description: string;
  notes: {
    id: string | null;
    text: string;
    version: number;
  };
  contracted: {
    contractedExtraId: string | null;
    contractedExtraVersion: number | null;
    contractId: string;
    validFrom: string;
    validTo: string;
    extraRequirement: "mandatory" | "optional";
    chargeType: "person" | "unit";
    timeUnit: "night" | "day" | "stay";
    travelDates: Array<{
      id: string;
      travelFrom: string;
      travelTo: string;
      net: string;
      rack: string;
      sell: string;
    }>;
  };
}

function timeUnitToForm(
  u: "None" | "Night" | "Day" | "Stay"
): "night" | "day" | "stay" {
  switch (u) {
    case "Day":
      return "day";
    case "Stay":
      return "stay";
    case "Night":
    case "None":
    default:
      return "night";
  }
}

function moneyToInput(m: { amount: number } | null | undefined): string {
  if (!m) return "";
  return String(m.amount);
}

/**
 * True when GET `/catalog/extras/:id` included a full contracted-extra row (has server `id`).
 * Some responses send a placeholder object without `id`; those must not block the secondary GET merge.
 */
export function hasEmbeddedContractedExtraFromDetail(
  detail: CatalogExtraDetail | undefined
): boolean {
  return Boolean(detail?.contractedExtra?.id);
}

/** Maps `contractedExtra` from the extra detail payload into form state. */
export function catalogContractedExtraDetailToFormContracted(
  c: CatalogContractedExtraDetail
): EditExtraFormValues["contracted"] {
  const fallbackTravelRow = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "td-1",
    travelFrom: "",
    travelTo: "",
    net: "",
    rack: "",
    sell: "",
  };

  const travelDates =
    Array.isArray(c.travelDates) && c.travelDates.length > 0
      ? c.travelDates.map((r) => ({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `td-${Date.now()}`,
          travelFrom: r.travelFrom ?? "",
          travelTo: r.travelTo ?? "",
          net: moneyToInput(r.net),
          rack: moneyToInput(r.rack),
          sell: moneyToInput(r.sell),
        }))
      : c.travelFrom?.trim() && c.travelTo?.trim()
        ? [
            {
              ...fallbackTravelRow,
              travelFrom: c.travelFrom,
              travelTo: c.travelTo,
              net: moneyToInput(c.net),
              rack: moneyToInput(c.rack),
              sell: moneyToInput(c.sell),
            },
          ]
        : [fallbackTravelRow];

  return {
    contractedExtraId: c.id,
    contractedExtraVersion: c.version,
    contractId: c.contractId,
    validFrom: c.validFrom ?? "",
    validTo: c.validTo ?? "",
    extraRequirement: c.extraType === "Mandatory" ? "mandatory" : "optional",
    chargeType: c.chargeType === "Person" ? "person" : "unit",
    timeUnit: timeUnitToForm(c.timeUnit),
    travelDates,
  };
}

export function emptyEditExtraFormValues(): EditExtraFormValues {
  const rowId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `td-${Date.now()}`;
  return {
    title: "",
    serviceIds: [],
    description: "",
    notes: { id: null, text: "", version: 0 },
    contracted: {
      contractedExtraId: null,
      contractedExtraVersion: null,
      contractId: "",
      validFrom: "",
      validTo: "",
      extraRequirement: "optional",
      chargeType: "person",
      timeUnit: "night",
      travelDates: [
        {
          id: rowId,
          travelFrom: "",
          travelTo: "",
          net: "",
          rack: "",
          sell: "",
        },
      ],
    },
  };
}

/**
 * Hydrates general + notes from GET `/catalog/extras/:id`.
 * Contracted-extra fields stay empty until the user picks a contract (then GET `/contracted-extras`).
 */
export function extraDetailToFormValues(
  detail: CatalogExtraDetail
): EditExtraFormValues {
  const defaults = emptyEditExtraFormValues();
  const note = detail.notes;

  const serviceIds = deriveCatalogExtraServiceIds(detail);

  return {
    title: detail.title,
    serviceIds,
    description: detail.description ?? "",
    notes: note
      ? { id: note.id, text: note.text ?? "", version: note.version }
      : { id: null, text: "", version: 0 },
    contracted: defaults.contracted,
  };
}

/** After PUT: merge full detail, including `contractedExtra` when the API returns a row. */
export function extraDetailToFormValuesAfterPut(
  detail: CatalogExtraDetail
): EditExtraFormValues {
  const defaults = emptyEditExtraFormValues();
  const note = detail.notes;
  const base = {
    title: detail.title,
    serviceIds: deriveCatalogExtraServiceIds(detail),
    description: detail.description ?? "",
    notes: note
      ? { id: note.id, text: note.text ?? "", version: note.version }
      : { id: null, text: "", version: 0 },
  };

  if (!detail.contractedExtra?.id) {
    const contractId = detail.contractId?.trim() ?? "";
    return {
      ...base,
      contracted: {
        ...defaults.contracted,
        contractId,
      },
    };
  }

  return {
    ...base,
    contracted: catalogContractedExtraDetailToFormContracted(
      detail.contractedExtra
    ),
  };
}
