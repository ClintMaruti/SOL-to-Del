import type { PromotionFormValues } from "@/entities/promotion";

type ApiValidationErrors = Record<string, string[]>;

function lowerFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function parsePathSegments(path: string) {
  return path.match(/[^.[\]]+/g) ?? [];
}

function buildPath(segments: string[]) {
  return segments.reduce<string>((result, segment) => {
    if (/^\d+$/.test(segment)) {
      return `${result}[${segment}]`;
    }

    return result ? `${result}.${segment}` : segment;
  }, "");
}

function getTopLevelFieldName(path: string) {
  return path.split(/[.[\]]/)[0] ?? path;
}

function mapConditionFieldPath(index: string, segments: string[]) {
  const basePath = `conditions[${index}]`;
  const [group, leaf] = segments.map(lowerFirst);

  if (!group) {
    return basePath;
  }

  if (group === "paxType") {
    return `${basePath}.paxCode`;
  }

  if (group === "nights") {
    if (leaf === "min") return `${basePath}.minNights`;
    if (leaf === "max") return `${basePath}.maxNights`;
    return basePath;
  }

  if (group === "suppliers") {
    if (leaf === "min") return `${basePath}.minSuppliers`;
    if (leaf === "max") return `${basePath}.maxSuppliers`;
    return basePath;
  }

  if (group === "nightsTotal") {
    if (leaf === "min") return `${basePath}.minNights`;
    if (leaf === "max") return `${basePath}.maxNights`;
    return basePath;
  }

  if (group === "paxCount") {
    if (leaf === "min") return `${basePath}.minPax`;
    if (leaf === "max") return `${basePath}.maxPax`;
    return basePath;
  }

  if (group === "age") {
    if (leaf === "min") return `${basePath}.minAge`;
    if (leaf === "max") return `${basePath}.maxAge`;
    return basePath;
  }

  return `${basePath}.${group}`;
}

function buildFlattenedActionEntries(formValues: PromotionFormValues) {
  const entries: Array<{
    kind: "discount" | "addOn";
    basePath: string;
  }> = [];

  formValues.actions.forEach((action, actionIndex) => {
    if (action.type === "DiscountPercentage") {
      action.rows.forEach((_, rowIndex) => {
        entries.push({
          kind: "discount",
          basePath: `actions[${actionIndex}].rows[${rowIndex}]`,
        });
      });
      return;
    }

    action.items.forEach((_, itemIndex) => {
      entries.push({
        kind: "addOn",
        basePath: `actions[${actionIndex}].items[${itemIndex}]`,
      });
    });
  });

  return entries;
}

function mapActionFieldPath(
  index: string,
  segments: string[],
  formValues: PromotionFormValues
) {
  const entry = buildFlattenedActionEntries(formValues)[Number(index)];
  if (!entry) {
    return `actions[${index}]`;
  }

  const [group, field] = segments.map(lowerFirst);
  if (!group) {
    return entry.basePath;
  }

  if (entry.kind === "discount" && group === "discount") {
    switch (field) {
      case "discountPercent":
        return `${entry.basePath}.discountPercent`;
      case "paxType":
        return `${entry.basePath}.paxCode`;
      case "paxIndexFrom":
        return `${entry.basePath}.paxIndexFrom`;
      case "paxIndexTo":
        return `${entry.basePath}.paxIndexTo`;
      case "targetNightsType":
        return `${entry.basePath}.targetNightsType`;
      case "nightsIndexFrom":
        return `${entry.basePath}.nightIndexFrom`;
      case "nightsIndexTo":
        return `${entry.basePath}.nightIndexTo`;
      default:
        return entry.basePath;
    }
  }

  if (entry.kind === "addOn" && group === "addOn") {
    switch (field) {
      case "serviceTypeId":
        return `${entry.basePath}.serviceTypeId`;
      case "name":
        return `${entry.basePath}.value`;
      default:
        return entry.basePath;
    }
  }

  return entry.basePath;
}

export function mapPromotionApiErrorPathToFormField(
  path: string,
  formValues: PromotionFormValues
) {
  const segments = parsePathSegments(path);
  if (segments.length === 0) {
    return lowerFirst(path);
  }

  const [root, index, ...rest] = segments;
  const normalizedRoot = lowerFirst(root ?? "");

  if (normalizedRoot === "note") {
    return "note";
  }

  if (
    normalizedRoot === "conditions" &&
    typeof index === "string" &&
    /^\d+$/.test(index)
  ) {
    return mapConditionFieldPath(index, rest);
  }

  if (
    normalizedRoot === "actions" &&
    typeof index === "string" &&
    /^\d+$/.test(index)
  ) {
    return mapActionFieldPath(index, rest, formValues);
  }

  const normalizedSegments = segments.map((segment, segmentIndex) =>
    /^\d+$/.test(segment)
      ? segment
      : segmentIndex === 0
        ? lowerFirst(segment)
        : lowerFirst(segment)
  );

  return buildPath(normalizedSegments);
}

export function toPromotionFormErrors(
  errors: ApiValidationErrors,
  formValues: PromotionFormValues
) {
  const result: Record<string, string> = {};

  for (const [path, messages] of Object.entries(errors)) {
    const message = messages[0];
    if (!message) continue;

    const formField = mapPromotionApiErrorPathToFormField(path, formValues);
    if (!result[formField]) {
      result[formField] = message;
    }
  }

  return result;
}

export function getPromotionErrorFieldNames(fieldPaths: string[]) {
  return Array.from(new Set(fieldPaths.map(getTopLevelFieldName)));
}
