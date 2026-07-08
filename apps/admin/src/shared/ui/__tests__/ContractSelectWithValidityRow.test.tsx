import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AnyFormApi } from "../form";
import { ContractSelectWithValidityRow } from "../ContractSelectWithValidityRow";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "labels.contract": "Contract",
        "labels.validFrom": "Valid From",
        "labels.validTo": "Valid To",
        "placeholders.selectContract": "Select contract",
      };
      return labels[key] ?? key;
    },
  }),
}));

function TestHarness({
  contractFieldName = "contractId",
  controlled = false,
}: {
  contractFieldName?: string;
  controlled?: boolean;
}) {
  const form = useForm({
    defaultValues:
      contractFieldName === "contractId"
        ? { contractId: "" }
        : { contracted: { contractId: "", validFrom: "", validTo: "" } },
  });
  return (
    <ContractSelectWithValidityRow
      form={form as unknown as AnyFormApi}
      contracts={[{ id: "c1", name: "Spring 2025" }]}
      contractFieldName={contractFieldName}
      htmlIdPrefix="test-prefix"
      displayValidFrom="2025-01-01"
      displayValidTo="2025-12-31"
      controlledContractSelect={controlled}
      selectedContractId={controlled ? null : undefined}
      onContractChange={controlled ? vi.fn() : undefined}
    />
  );
}

describe("ContractSelectWithValidityRow", () => {
  it("renders contract select and read-only validity fields", () => {
    render(<TestHarness contractFieldName="contractId" />);

    expect(screen.getByText("Contract")).toBeDefined();
    expect(screen.getByText("Valid From")).toBeDefined();
    expect(screen.getByText("Valid To")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
  });
});
