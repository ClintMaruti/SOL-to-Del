import { i18n } from "@sol/i18n";
import { z } from "zod";

import {
  getPolicyTravelDateValidationIssues,
  type ContractPolicyTravelDateValidationContext,
} from "@/entities/supplier-contract";
import { VALIDATION_MESSAGES } from "@/shared/ui/form/validation-messages";

const penaltyRuleSchema = z
  .object({
    starts: z.enum(["Before", "After"]),
    referenceEvent: z.enum(["TravelDate", "BookingDate"]),
    startDay: z
      .number({
        error: i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("policies.startDay", { ns: "admin" }),
        }),
      })
      .int()
      .min(
        0,
        i18n.t("validation.fieldMustBeZeroOrGreater", {
          ns: "admin",
          field: i18n.t("policies.startDay", { ns: "admin" }),
        })
      ),
    startTime: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("policies.startTime", { ns: "admin" })
        )
      ),
    endDay: z
      .number({
        error: i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("policies.endDay", { ns: "admin" }),
        }),
      })
      .int()
      .min(
        0,
        i18n.t("validation.fieldMustBeZeroOrGreater", {
          ns: "admin",
          field: i18n.t("policies.endDay", { ns: "admin" }),
        })
      ),
    endTime: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(
          i18n.t("policies.endTime", { ns: "admin" })
        )
      ),
    penaltyValue: z
      .number({
        error: i18n.t("validation.required", {
          ns: "admin",
          field: i18n.t("policies.penalty", { ns: "admin" }),
        }),
      })
      .min(
        0,
        i18n.t("validation.fieldMustBeZeroOrGreater", {
          ns: "admin",
          field: i18n.t("policies.penalty", { ns: "admin" }),
        })
      ),
    penaltyType: z.enum(["Percent", "Value"]),
  })
  .refine(
    (rule) => rule.penaltyType !== "Percent" || rule.penaltyValue <= 100,
    {
      message: i18n.t("validation.penaltyCannotExceedPercent", { ns: "admin" }),
      path: ["penaltyValue"],
    }
  );

const travelDateSchema = z
  .object({
    from: z
      .string()
      .min(
        1,
        VALIDATION_MESSAGES.required(i18n.t("labels.from", { ns: "admin" }))
      ),
    to: z.string().nullable().optional(),
  })
  .refine((range) => !range.to || range.to >= range.from, {
    message: i18n.t("validation.travelDateFromBeforeTo", { ns: "admin" }),
    path: ["to"],
  });

export const buildCreateContractPolicySchema = (
  context?: ContractPolicyTravelDateValidationContext
) =>
  z
    .object({
      policyName: z
        .string()
        .min(
          1,
          VALIDATION_MESSAGES.required(
            i18n.t("policies.policyName", { ns: "admin" })
          )
        ),
      description: z
        .string()
        .min(
          1,
          VALIDATION_MESSAGES.required(
            i18n.t("labels.description", { ns: "admin" })
          )
        ),
      refundable: z.boolean(),
      travelDates: z.array(travelDateSchema).min(
        1,
        i18n.t("validation.atLeastOneTravelDate", {
          ns: "admin",
        })
      ),
      conditions: z.array(penaltyRuleSchema),
    })
    .superRefine((data, ctx) => {
      for (const issue of getPolicyTravelDateValidationIssues(
        data.travelDates,
        context
      )) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
        });
      }
    })
    .refine((data) => !data.refundable || data.conditions.length > 0, {
      message: i18n.t("validation.refundablePolicyConditionRequired", {
        ns: "admin",
      }),
      path: ["conditions"],
    })
    .transform((data) => ({
      policyName: data.policyName.trim(),
      description: data.description.trim(),
      travelDates: data.travelDates.map((range) => ({
        from: range.from,
        to: range.to || null,
      })),
      refundable: data.refundable,
      conditions: data.conditions,
    }));

export const createContractPolicySchema = buildCreateContractPolicySchema();

export type CreateContractPolicySubmitData = z.output<
  typeof createContractPolicySchema
>;
