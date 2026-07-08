import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ServiceRateDialog } from "../ui/ServiceRateDialog";

vi.mock("../model/useServiceRateForm", () => ({
  useServiceRateForm: () => ({
    form: {
      handleSubmit: () => vi.fn(),
      Field: ({
        children,
      }: {
        children: (field: unknown) => React.ReactNode;
      }) =>
        children({
          state: { value: "", meta: { errors: [] } },
          handleChange: vi.fn(),
          handleBlur: vi.fn(),
        }),
    },
    isPending: false,
  }),
}));

vi.mock("../ui/ServiceRateFormFields", () => ({
  ServiceRateFormFields: () => <div data-testid="rate-form-fields" />,
}));

describe("ServiceRateDialog", () => {
  it("uses centered dialog layout without top-right positioning", () => {
    render(
      <ServiceRateDialog
        open
        onOpenChange={vi.fn()}
        serviceId="svc-1"
        title="Create Rate"
      />
    );

    const content = document.querySelector('[role="dialog"]');
    expect(content?.className).toContain("max-h-[90vh]");
    expect(content?.className).not.toContain("right-4");
    expect(content?.className).not.toContain("top-4");
    expect(content?.className).not.toContain("translate-x-0");
    expect(screen.getByTestId("rate-form-fields")).toBeDefined();
  });
});
