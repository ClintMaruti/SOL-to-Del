import { QueryClient, QueryClientProvider } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ServiceRatesIdentitySection } from "../ui/ServiceRatesIdentitySection";

const mockUseServiceRates = vi.fn();

vi.mock("@/entities/service-rate", () => ({
  useServiceRates: () => mockUseServiceRates(),
}));

vi.mock("@/features/manage-service-rates", () => ({
  ServiceRateDialog: () => null,
}));

vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>();
  return actual;
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("ServiceRatesIdentitySection i18n", () => {
  it("renders Actions column header from tableHeaders.actions", () => {
    mockUseServiceRates.mockReturnValue({
      data: [
        {
          id: "rate-1",
          serviceId: "svc-1",
          name: "Standard",
          chargeType: "Person",
          timeUnit: "Night",
          currency: "USD",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ServiceRatesIdentitySection serviceId="svc-1" />, {
      wrapper: createWrapper(),
    });

    const actionsHeader = screen.getByText("Actions").closest("div");
    expect(actionsHeader?.className).toContain("text-center");
    expect(screen.getByLabelText("Edit")).toBeDefined();
    // Delete button is present but disabled (API not yet available).
    const deleteBtn = screen.getByLabelText("Delete") as HTMLButtonElement;
    expect(deleteBtn).toBeDefined();
    expect(deleteBtn.disabled).toBe(true);
    expect(screen.queryByLabelText("Duplicate")).toBeNull();
  });
});
