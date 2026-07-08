import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SupplierContentEditor } from "../ui/SupplierContentEditor";

vi.mock("@/widgets/supplier-content-list", () => ({
  SupplierContentList: () => <div data-testid="supplier-content-list-mock" />,
}));

describe("SupplierContentEditor", () => {
  it("renders section heading and content list", () => {
    render(<SupplierContentEditor supplierId="sup-1" />);

    expect(screen.getByTestId("supplier-content-list-mock")).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Content" })
    ).toBeTruthy();
  });
});
