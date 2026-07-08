import type { TFunction } from "i18next";

import type {
  EligibilityValidityDate,
  PaxCompositionGroup,
} from "@/entities/service-eligibility";

export interface CapacityValues {
  totalPaxMin: number | null;
  totalPaxMax: number | null;
  unitsMin: number | null;
  unitsMax: number | null;
  nightsMin: number | null;
  nightsMax: number | null;
  minimumAge: number | null;
}

export function computeFieldErrors(
  t: TFunction,
  cap: CapacityValues,
  paxGroups: PaxCompositionGroup[]
): string[] {
  const errors: string[] = [];

  const pairs: { field: string; min: number | null; max: number | null }[] = [
    {
      field: t("sections.totalPax"),
      min: cap.totalPaxMin,
      max: cap.totalPaxMax,
    },
    { field: t("sections.unit"), min: cap.unitsMin, max: cap.unitsMax },
    { field: t("sections.nights"), min: cap.nightsMin, max: cap.nightsMax },
  ];

  for (const { field, min, max } of pairs) {
    const hasMin = min !== null;
    const hasMax = max !== null;
    if (hasMin && hasMax && min! > max!)
      errors.push(t("errors.fieldMinGreaterThanMax", { field }));
  }

  for (const group of paxGroups) {
    for (const c of group.paxTypeConstraints) {
      const label = c.paxType;
      const hasMin = c.minCount !== null;
      const hasMax = c.maxCount !== null;
      if (hasMin !== hasMax) {
        errors.push(t("errors.paxMinMaxRequired", { field: label }));
      } else if (hasMin && hasMax && c.maxCount! < c.minCount!) {
        errors.push(t("errors.fieldMinGreaterThanMax", { field: label }));
      }

      if (c.ageRestriction) {
        const { ageMin, ageMax } = c.ageRestriction;
        const hasAgeMin = ageMin !== null && ageMin !== undefined;
        const hasAgeMax = ageMax !== null && ageMax !== undefined;
        if (hasAgeMin && !hasAgeMax)
          errors.push(t("errors.fieldMaxAgeRequired", { field: label }));
        else if (hasAgeMax && !hasAgeMin)
          errors.push(t("errors.fieldMinAgeRequired", { field: label }));
        else if (hasAgeMin && hasAgeMax && ageMax < ageMin)
          errors.push(t("errors.fieldMinAgeGreaterThanMax", { field: label }));
      }
    }
  }

  return errors;
}

export function computeSubmitErrors(
  t: TFunction,
  cap: CapacityValues,
  validityDates: EligibilityValidityDate[],
  paxGroups: PaxCompositionGroup[]
): string[] {
  const errors: string[] = [];

  if (cap.minimumAge !== null && cap.minimumAge < 0) {
    errors.push(
      t("validation.fieldMustBeZeroOrGreater", {
        field: t("labels.minimumAge"),
      })
    );
  }

  const hasIncompleteValidityDate = validityDates.some(
    (vd) => !vd.from || !vd.to
  );
  if (hasIncompleteValidityDate) {
    errors.push(t("errors.validityDateIncomplete"));
  }

  const hasInvertedValidityDate = validityDates.some(
    (vd) => vd.from && vd.to && vd.from > vd.to
  );
  if (hasInvertedValidityDate) {
    errors.push(t("errors.startDateAfterEndDate"));
  }

  const pairs: { field: string; min: number | null; max: number | null }[] = [
    {
      field: t("sections.totalPax"),
      min: cap.totalPaxMin,
      max: cap.totalPaxMax,
    },
    { field: t("sections.unit"), min: cap.unitsMin, max: cap.unitsMax },
    { field: t("sections.nights"), min: cap.nightsMin, max: cap.nightsMax },
  ];

  for (const { field, min, max } of pairs) {
    if (min !== null && min < 0) {
      errors.push(
        t("validation.fieldMustBeZeroOrGreater", { field: `${field} min` })
      );
    }

    if (max !== null && max < 0) {
      errors.push(
        t("validation.fieldMustBeZeroOrGreater", { field: `${field} max` })
      );
    }

    if (min !== null && max !== null && min > max) {
      errors.push(t("errors.fieldMinGreaterThanMax", { field }));
    }
  }

  for (const group of paxGroups) {
    for (const c of group.paxTypeConstraints) {
      const field = c.paxType;
      const hasMin = c.minCount !== null;
      const hasMax = c.maxCount !== null;

      if (!hasMin || !hasMax) {
        errors.push(t("errors.paxMinMaxRequired", { field }));
        continue;
      }

      if (c.minCount !== null && c.minCount < 0) {
        errors.push(
          t("validation.fieldMustBeZeroOrGreater", { field: `${field} min` })
        );
      }

      if (c.maxCount !== null && c.maxCount < 0) {
        errors.push(
          t("validation.fieldMustBeZeroOrGreater", { field: `${field} max` })
        );
      }

      if (hasMin && hasMax && c.maxCount! < c.minCount!) {
        errors.push(t("errors.fieldMinGreaterThanMax", { field }));
      }

      if (
        cap.totalPaxMax !== null &&
        c.maxCount !== null &&
        c.maxCount > cap.totalPaxMax
      ) {
        errors.push(t("errors.paxMaxExceedsTotalMax"));
      }

      if (c.ageRestriction) {
        const { ageMin, ageMax, ruleMode } = c.ageRestriction;
        const hasAgeMin = ageMin !== null && ageMin !== undefined;
        const hasAgeMax = ageMax !== null && ageMax !== undefined;

        if (hasAgeMin && ageMin < 0) {
          errors.push(
            t("validation.fieldMustBeZeroOrGreater", {
              field: `${field} ${t("labels.minAge")}`,
            })
          );
        }

        if (hasAgeMax && ageMax < 0) {
          errors.push(
            t("validation.fieldMustBeZeroOrGreater", {
              field: `${field} ${t("labels.maxAge")}`,
            })
          );
        }

        if ((hasAgeMin || hasAgeMax) && !ruleMode) {
          errors.push(t("errors.ageRuleModeRequired", { field }));
        }

        if (hasAgeMin && hasAgeMax && ageMax < ageMin) {
          errors.push(t("errors.fieldMinAgeGreaterThanMax", { field }));
        }
      }
    }
  }

  return errors;
}
