import {
  hasContractSelected,
  type EditExtraFormValues,
  type EditExtraSubmitValues,
} from "../model/schema";

function isZeroMoneyInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n === 0;
}

function travelRowsHaveZeroPrice(
  travelDates: EditExtraFormValues["contracted"]["travelDates"]
): boolean {
  return travelDates.some(
    (row) =>
      isZeroMoneyInput(row.net) ||
      isZeroMoneyInput(row.rack) ||
      isZeroMoneyInput(row.sell)
  );
}

/** True when a contract is selected and net/rack/sell includes explicit 0. */
export function travelDatesHaveZeroPrice(
  contracted: EditExtraSubmitValues["contracted"]
): boolean {
  if (!hasContractSelected(contracted)) {
    return false;
  }

  return travelRowsHaveZeroPrice(contracted.travelDates);
}

export function formContractedHasZeroPrice(
  contracted: EditExtraFormValues["contracted"]
): boolean {
  if (!hasContractSelected(contracted)) {
    return false;
  }

  return travelRowsHaveZeroPrice(contracted.travelDates);
}
