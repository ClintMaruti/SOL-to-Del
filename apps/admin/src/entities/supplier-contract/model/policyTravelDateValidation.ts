import { i18n } from "@sol/i18n";

export interface ContractPolicyTravelDateValidationContext {
  contractValidFrom?: string | null;
  contractValidTo?: string | null;
}

interface PolicyTravelDateInput {
  from?: string | null;
  to?: string | null;
}

export interface PolicyTravelDateValidationIssue {
  message: string;
  path: (string | number)[];
}

const rangesOverlap = (
  fromA: string,
  toA: string,
  fromB: string,
  toB: string
) => fromA <= toB && toA >= fromB;

const addIssueOnce = (
  issues: PolicyTravelDateValidationIssue[],
  seen: Set<string>,
  issue: PolicyTravelDateValidationIssue
) => {
  const key = `${issue.path.join(".")}:${issue.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  issues.push(issue);
};

const addTravelDateFieldIssue = (
  issues: PolicyTravelDateValidationIssue[],
  seen: Set<string>,
  index: number,
  field: "from" | "to",
  message: string
) => {
  addIssueOnce(issues, seen, {
    message,
    path: ["travelDates", index, field],
  });
};

export function getPolicyTravelDateValidationIssues(
  ranges: PolicyTravelDateInput[],
  context?: ContractPolicyTravelDateValidationContext
): PolicyTravelDateValidationIssue[] {
  const contractValidFrom = context?.contractValidFrom?.trim();
  const contractValidTo = context?.contractValidTo?.trim();
  const hasContractBounds = Boolean(contractValidFrom && contractValidTo);
  const outsideContractMessage = i18n.t(
    "validation.travelDatesOutsideContract",
    { ns: "admin" }
  );
  const overlapMessage = i18n.t(
    "validation.ratePlanTravelDates.overlappingRanges",
    { ns: "admin" }
  );

  const issues: PolicyTravelDateValidationIssue[] = [];
  const seen = new Set<string>();
  const completeRanges: Array<{ index: number; from: string; to: string }> = [];

  ranges.forEach((range, index) => {
    const from = range.from?.trim() ?? "";
    const to = range.to?.trim() ?? "";

    if (!from || (to && to < from)) return;

    const resolvedTo = to || (hasContractBounds ? contractValidTo! : "");

    if (hasContractBounds) {
      if (from < contractValidFrom!) {
        addTravelDateFieldIssue(
          issues,
          seen,
          index,
          "from",
          outsideContractMessage
        );
      }

      if (resolvedTo > contractValidTo!) {
        addTravelDateFieldIssue(
          issues,
          seen,
          index,
          "to",
          outsideContractMessage
        );
      }
    }

    if (resolvedTo) {
      completeRanges.push({ index, from, to: resolvedTo });
    }
  });

  for (let i = 0; i < completeRanges.length; i += 1) {
    for (let j = i + 1; j < completeRanges.length; j += 1) {
      const first = completeRanges[i];
      const second = completeRanges[j];

      if (!rangesOverlap(first.from, first.to, second.from, second.to)) {
        continue;
      }

      addTravelDateFieldIssue(
        issues,
        seen,
        first.index,
        "from",
        overlapMessage
      );
      addTravelDateFieldIssue(issues, seen, first.index, "to", overlapMessage);
      addTravelDateFieldIssue(
        issues,
        seen,
        second.index,
        "from",
        overlapMessage
      );
      addTravelDateFieldIssue(issues, seen, second.index, "to", overlapMessage);
    }
  }

  return issues;
}
