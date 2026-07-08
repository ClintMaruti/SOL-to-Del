import { TooltipProvider } from "@sol/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierContracts } from "@/entities/supplier-contract/api/useSupplierContracts";
import { useToggleSupplierContractStatus } from "@/entities/supplier-contract/api/useToggleSupplierContractStatus";
import { createSupplierContract } from "@/entities/supplier-contract/testing/factories";

import { SupplierContractsList } from "../ui/SupplierContractsList";

function renderWithRouter(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>{ui}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

vi.mock("@/entities/supplier-contract/api/useSupplierContracts", () => ({
  useSupplierContracts: vi.fn(),
}));

vi.mock(
  "@/entities/supplier-contract/api/useToggleSupplierContractStatus",
  () => ({
    useToggleSupplierContractStatus: vi.fn(),
  })
);

vi.mock("@/entities/supplier-contract", () => ({
  useCreateSupplierContract: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  })),
}));

const mockUseSupplierContracts = useSupplierContracts as ReturnType<
  typeof vi.fn
>;

const mockMutate = vi.fn();
const mockUseToggleSupplierContractStatus =
  useToggleSupplierContractStatus as ReturnType<typeof vi.fn>;

const mockContracts = [
  createSupplierContract("c-1", "Contract Alpha", {
    link: "https://example.com/alpha.pdf",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    isActive: true,
  }),
  createSupplierContract("c-2", "Contract Beta", {
    link: null,
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    isActive: false,
  }),
];

describe("SupplierContractsList", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2025-06-15"));
    mockUseToggleSupplierContractStatus.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // userEvent with fake timers requires advanceTimers to avoid hangs
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  describe("Header", () => {
    it("should render the section title and description", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("Contract")).toBeDefined();
      expect(
        screen.getByText("Add a new contract to this supplier.")
      ).toBeDefined();
    });

    it("should render the Attach Contract button", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(
        screen.getByRole("button", { name: /attach contract/i })
      ).toBeDefined();
    });

    it("should render a clickable Attach Contract button", async () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const button = screen.getByRole("button", {
        name: /attach contract/i,
      });
      await user.click(button);
      expect(button).toBeDefined();
    });
  });

  describe("Loading State", () => {
    it("should show loading skeleton when loading", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { container } = renderWithRouter(
        <SupplierContractsList supplierId="sup-1" />
      );

      const skeletons = container.querySelectorAll(
        "[data-slot='skeleton'], .animate-pulse"
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error State", () => {
    it("should show error message on error", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("Network error")).toBeDefined();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no contracts", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("No Contracts yet")).toBeDefined();
    });
  });

  describe("List State", () => {
    it("should render contracts in a table", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("Contract Alpha")).toBeDefined();
      expect(screen.getByText("Contract Beta")).toBeDefined();
    });

    it("should render table headers", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("Contract Name")).toBeDefined();
      expect(screen.getByText("Agency Group")).toBeDefined();
      expect(screen.getByText("Contract Link")).toBeDefined();
      expect(screen.getByText("Valid From")).toBeDefined();
      expect(screen.getByText("Valid To")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
    });

    it("should render ANY and named agency groups as plain table text", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const anyScope = screen.getByText("ANY");
      const namedScope = screen.getByText("AAConsultants");

      expect(anyScope).toBeDefined();
      expect(namedScope).toBeDefined();
      expect(anyScope.closest("[data-slot='badge']")).toBeNull();
      expect(namedScope.closest("[data-slot='badge']")).toBeNull();
    });

    it("should render agencyGroupName from the contract response instead of the agencyGroupId", () => {
      const agencyGroupId = "019cbe03-2b86-7940-9244-b600074cd0b0";
      mockUseSupplierContracts.mockReturnValue({
        data: [
          createSupplierContract(
            "019e3b19-e274-7b87-aa63-bc3bdd4d51b1",
            "New contract",
            {
              agencyGroupId,
              agencyGroupName: "Elewana Lodges & Camps",
              validFrom: "2028-05-02",
              validTo: "2029-05-31",
              isActive: false,
            }
          ),
        ],
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("Elewana Lodges & Camps")).toBeDefined();
      expect(screen.queryByText(agencyGroupId)).toBeNull();
    });

    it("should show switch checked for active contract and unchecked for inactive", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const switches = screen.getAllByRole("switch");
      expect(switches[0].getAttribute("data-state")).toBe("checked");
      expect(switches[1].getAttribute("data-state")).toBe("unchecked");
    });

    it("should render link for contracts with link", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("https://example.com/alpha.pdf");
    });

    it("should render dash for contracts without link", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      expect(screen.getByText("—")).toBeDefined();
    });

    it("should render a status switch for each contract", () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const switches = screen.getAllByRole("switch");
      expect(switches).toHaveLength(2);
    });

    it("should call toggle mutation when switch is clicked and user confirms", async () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const switches = screen.getAllByRole("switch");
      await user.click(switches[1]);

      const activateButton = screen.getByRole("button", {
        name: /activate/i,
      });
      await user.click(activateButton);

      expect(mockMutate).toHaveBeenCalledWith(
        {
          supplierId: "sup-1",
          contractId: "c-2",
          isActive: false,
        },
        expect.any(Object)
      );
    });

    it("should call toggle mutation with isActive false for inactive contract", async () => {
      mockUseSupplierContracts.mockReturnValue({
        data: mockContracts,
        isLoading: false,
        error: null,
      });

      renderWithRouter(<SupplierContractsList supplierId="sup-1" />);

      const switches = screen.getAllByRole("switch");
      await user.click(switches[1]);

      const activateButton = screen.getByRole("button", {
        name: /activate/i,
      });
      await user.click(activateButton);

      expect(mockMutate).toHaveBeenCalledWith(
        {
          supplierId: "sup-1",
          contractId: "c-2",
          isActive: false,
        },
        expect.any(Object)
      );
    });
  });
});
