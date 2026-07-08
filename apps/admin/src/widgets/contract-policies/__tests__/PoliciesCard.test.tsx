import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorAlert } from "../ui/ErrorAlert";
import { PoliciesCard } from "../ui/PoliciesCard";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>();
  return {
    ...actual,
    DatePickerGridInput: ({
      id,
      value,
      onChange,
      hasError: _hasError,
      ...props
    }: {
      id?: string;
      value?: string;
      onChange?: (value: string) => void;
      hasError?: boolean;
      [key: string]: unknown;
    }) => (
      <input
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        {...props}
      />
    ),
  };
});

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const createdPolicy = {
  id: "policy-new",
  policyName: "Created Policy",
  description: "Created description",
  refundable: false,
  isActive: true,
  travelDates: [
    { id: "range-1", version: 1, dateFrom: "2026-01-01", dateTo: null },
  ],
  conditions: [],
};

const existingPolicy = {
  id: "policy-existing",
  policyName: "Existing Policy",
  description: "Existing description",
  refundable: false,
  isActive: true,
  travelDates: [
    { id: "range-existing", version: 1, dateFrom: "2026-02-01", dateTo: null },
  ],
  conditions: [],
};

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

function getPolicyTrigger(policyName: string) {
  const headerContent = screen.getByText(policyName).parentElement;
  const headerRow = headerContent?.parentElement;
  const trigger = headerRow?.querySelector("[data-slot='collapsible-trigger']");

  if (!(trigger instanceof HTMLElement)) {
    throw new Error(`Could not find trigger for ${policyName}`);
  }

  return trigger;
}

describe("PoliciesCard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps a newly created policy open until it is manually closed", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce([]).mockResolvedValue([createdPolicy]);
    mockApi.post.mockResolvedValueOnce([createdPolicy]);

    renderWithQueryClient(
      <PoliciesCard supplierId="sup-1" contractId="contract-1" />
    );

    await user.click(screen.getByRole("button", { name: /add policy/i }));
    await user.type(screen.getByLabelText(/policy name/i), "Created Policy");
    await user.type(
      screen.getByLabelText(/description/i),
      "Created description"
    );
    await user.type(screen.getByLabelText(/from/i), "2026-01-01");
    await user.click(screen.getByRole("button", { name: /save policy/i }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/contract-1/cancellation-policies",
        expect.objectContaining({
          policyName: "Created Policy",
          description: "Created description",
          travelDates: [{ dateFrom: "2026-01-01", dateTo: null }],
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Policy", { exact: true })).toBeNull();
    });

    const createdPolicyInput = screen.getByDisplayValue("Created Policy");
    expect(
      createdPolicyInput
        .closest("[data-slot='collapsible-content']")
        ?.getAttribute("data-state")
    ).toBe("open");

    await user.click(getPolicyTrigger("Created Policy"));

    await waitFor(() => {
      const input = screen.queryByDisplayValue("Created Policy");
      expect(
        input
          ?.closest("[data-slot='collapsible-content']")
          ?.getAttribute("data-state") ?? "closed"
      ).toBe("closed");
    });
  });

  it("renders add policy as a ghost button", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    renderWithQueryClient(
      <PoliciesCard supplierId="sup-1" contractId="contract-1" />
    );

    expect(
      screen
        .getByRole("button", { name: /add policy/i })
        .getAttribute("data-variant")
    ).toBe("ghost");
  });

  it("renders error alert messages as separate rows", () => {
    render(<ErrorAlert messages={["First error", "Second error"]} />);

    const alert = screen.getByRole("alert");
    expect(alert.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("First error")).toBeTruthy();
    expect(screen.getByText("Second error")).toBeTruthy();
  });

  it("resets existing policy edits when cancel is clicked", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce([existingPolicy]);

    renderWithQueryClient(
      <PoliciesCard supplierId="sup-1" contractId="contract-1" />
    );

    await screen.findByText("Existing Policy");
    await user.click(getPolicyTrigger("Existing Policy"));

    expect(
      (
        screen.getByRole("button", {
          name: /save policy/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);

    const nameInput = screen.getByDisplayValue("Existing Policy");
    await user.clear(nameInput);
    await user.type(nameInput, "Changed Policy");

    expect(screen.getByDisplayValue("Changed Policy")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: /save policy/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);

    await user.clear(nameInput);
    await user.type(nameInput, "Existing Policy");

    expect(
      (
        screen.getByRole("button", {
          name: /save policy/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);

    await user.clear(nameInput);
    await user.type(nameInput, "Changed Policy");

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Policy")).toBeTruthy();
    });
    expect(screen.queryByDisplayValue("Changed Policy")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: /save policy/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("shows one overlap message and marks overlapping travel date inputs invalid", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce([]);

    renderWithQueryClient(
      <PoliciesCard
        supplierId="sup-1"
        contractId="contract-1"
        contractValidFrom="2026-01-01"
        contractValidTo="2026-12-31"
      />
    );

    await user.click(screen.getByRole("button", { name: /add policy/i }));
    await user.type(screen.getByLabelText(/policy name/i), "Overlap Policy");
    await user.type(screen.getByLabelText(/description/i), "Overlap details");

    const firstFromInput = screen.getByLabelText(/from/i);
    const firstToInput = screen.getByLabelText(/to/i);
    await user.type(firstFromInput, "2026-01-01");
    await user.type(firstToInput, "2026-03-31");

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    const fromInputs = screen.getAllByLabelText(/from/i);
    const toInputs = screen.getAllByLabelText(/to/i);
    await user.type(fromInputs[1], "2026-03-15");
    await user.type(toInputs[1], "2026-04-01");

    await user.click(screen.getByRole("button", { name: /save policy/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Travel date ranges must not overlap.")
      ).toHaveLength(1);
    });
    expect(fromInputs[0].getAttribute("aria-invalid")).toBe("true");
    expect(toInputs[0].getAttribute("aria-invalid")).toBe("true");
    expect(fromInputs[1].getAttribute("aria-invalid")).toBe("true");
    expect(toInputs[1].getAttribute("aria-invalid")).toBe("true");
  });
});
