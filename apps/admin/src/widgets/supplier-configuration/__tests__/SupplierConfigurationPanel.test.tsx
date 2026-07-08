import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SupplierConfigurationPanel } from "../ui/SupplierConfigurationPanel";

vi.mock("@/widgets/supplier-closeouts", () => ({
  SupplierCloseoutsCard: ({ supplierId }: { supplierId: string }) => (
    <div data-testid="supplier-closeouts-card">Closeouts for {supplierId}</div>
  ),
}));

vi.mock("@/widgets/supplier-pax-configurations", () => ({
  SupplierPaxConfigurationsSection: ({
    supplierId,
  }: {
    supplierId: string;
  }) => (
    <section>
      <h2>PAX Types & Ages</h2>
      <p>PAX for {supplierId}</p>
    </section>
  ),
}));

describe("SupplierConfigurationPanel", () => {
  it("renders PAX configuration above supplier closeouts", () => {
    render(<SupplierConfigurationPanel supplierId="sup-1" />);

    const pax = screen.getByText("PAX Types & Ages");
    const closeouts = screen.getByTestId("supplier-closeouts-card");

    expect(pax).toBeDefined();
    expect(closeouts.textContent).toContain("sup-1");
    expect(
      pax.compareDocumentPosition(closeouts) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
