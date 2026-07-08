import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SupplierServicesListEmpty } from "../ui/SupplierServicesListEmpty";

describe("SupplierServicesListEmpty", () => {
  it("should render title and description", () => {
    render(<SupplierServicesListEmpty />);

    expect(screen.getByText("No Services yet")).toBeDefined();
    expect(
      screen.getByText(/services will appear here once they are added/i)
    ).toBeDefined();
  });

  it("should render Create Service button when onCreateService is provided", () => {
    render(<SupplierServicesListEmpty onCreateService={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /create service/i })
    ).toBeDefined();
  });

  it("should call onCreateService when button is clicked", async () => {
    const user = userEvent.setup();
    const onCreateService = vi.fn();
    render(<SupplierServicesListEmpty onCreateService={onCreateService} />);

    await user.click(screen.getByRole("button", { name: /create service/i }));

    expect(onCreateService).toHaveBeenCalledTimes(1);
  });
});
