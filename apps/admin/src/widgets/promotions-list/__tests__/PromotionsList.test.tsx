import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Promotion,
  usePromotions,
  useTogglePromotionStatus,
} from "@/entities/promotion";
import { createPromotion } from "@/entities/promotion/testing/factories";
import { headOfficeDetailPath, ROUTES } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import { PromotionsList } from "../ui/PromotionsList";

const { mockTogglePromotionStatus, mockRefetch } = vi.hoisted(() => ({
  mockTogglePromotionStatus: vi.fn(),
  mockRefetch: vi.fn(),
}));

vi.mock("@/entities/promotion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/promotion")>();

  return {
    ...actual,
    usePromotions: vi.fn(() => ({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })),
    useTogglePromotionStatus: vi.fn(() => ({
      mutate: mockTogglePromotionStatus,
      isPending: false,
    })),
  };
});

const mockUsePromotions = vi.mocked(usePromotions);
const mockUseTogglePromotionStatus = vi.mocked(useTogglePromotionStatus);

function renderList(initialEntry: string = headOfficeDetailPath("sho-1")) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path={ROUTES.SUPPLIER_HEAD_OFFICES_DETAIL}
          element={<PromotionsList headOfficeId="sho-1" />}
        />
        <Route
          path={ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_CREATE}
          element={<div>Create Promotion Route</div>}
        />
        <Route
          path={ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_DETAIL}
          element={<div>Promotion Detail Route</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

function mockQuerySuccess(data: Promotion[]) {
  mockUsePromotions.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  } as unknown as ReturnType<typeof mockUsePromotions>);
}

describe("PromotionsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoadingStates.setState({ promotionsStatus: {} });

    mockUsePromotions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof mockUsePromotions>);

    mockUseTogglePromotionStatus.mockReturnValue({
      mutate: mockTogglePromotionStatus,
      isPending: false,
    } as unknown as ReturnType<typeof mockUseTogglePromotionStatus>);
  });

  it("renders the header and create button in the empty state without a table", () => {
    renderList();

    expect(screen.getByText("Promotions")).toBeDefined();
    expect(
      screen.getByText(
        "Create and manage promotions to apply special offers, discounts, or benefits to selected services and date ranges."
      )
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Create Promotion" })
    ).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Promotion Name")).toBeNull();
  });

  it("renders loading skeletons while the list is loading", () => {
    mockUsePromotions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof mockUsePromotions>);

    const { container } = renderList();

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0);
  });

  it("renders the table when promotions are available", () => {
    mockQuerySuccess([
      createPromotion("promo-1", "Stay 4 Pay 3", {
        bookingWindowFrom: "2027-01-01",
        bookingWindowTo: "2027-03-31",
      }),
    ]);

    renderList();

    expect(
      screen.getByRole("button", { name: "Promotion Name" })
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "Stay 4 Pay 3" })).toBeDefined();
    expect(screen.getByText("01 Jan 2027")).toBeDefined();
    expect(screen.getByText("31 Mar 2027")).toBeDefined();
  });

  it("shows an error state and retries on demand", async () => {
    const user = userEvent.setup();

    mockUsePromotions.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error("Load failed"),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof mockUsePromotions>);

    renderList();

    expect(screen.getByText("Load failed")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("navigates to the create route from the header button", async () => {
    const user = userEvent.setup();

    renderList();

    await user.click(screen.getByRole("link", { name: "Create Promotion" }));

    expect(screen.getByText("Create Promotion Route")).toBeDefined();
  });

  it("navigates to the promotion detail route when the name is clicked", async () => {
    const user = userEvent.setup();

    mockQuerySuccess([createPromotion("promo-1", "Stay 4 Pay 3")]);

    renderList();

    await user.click(screen.getByRole("link", { name: "Stay 4 Pay 3" }));

    expect(screen.getByText("Promotion Detail Route")).toBeDefined();
  });

  it("activates an inactive promotion immediately from the switch", async () => {
    const user = userEvent.setup();

    mockQuerySuccess([
      createPromotion("promo-1", "Stay 4 Pay 3", {
        isActive: false,
      }),
    ]);

    renderList();

    await user.click(screen.getByRole("switch"));

    expect(mockTogglePromotionStatus).toHaveBeenCalledWith({
      headOfficeId: "sho-1",
      promotionId: "promo-1",
      activate: true,
    });
  });

  it("opens a confirmation dialog before deactivating an active promotion", async () => {
    const user = userEvent.setup();

    mockQuerySuccess([
      createPromotion("promo-1", "Stay 4 Pay 3", {
        isActive: true,
      }),
    ]);

    renderList();

    await user.click(screen.getByRole("switch"));

    expect(mockTogglePromotionStatus).not.toHaveBeenCalled();
    expect(screen.getByText(/Deactivate promotion/i)).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(mockTogglePromotionStatus).toHaveBeenCalledWith(
      {
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: false,
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
  });

  it("disables the row switch while that promotion is toggling", () => {
    useLoadingStates.setState({
      promotionsStatus: { "promo-1": true },
    });

    mockQuerySuccess([createPromotion("promo-1", "Stay 4 Pay 3")]);

    renderList();

    const switchButton = screen.getByRole("switch");

    expect((switchButton as HTMLButtonElement).disabled).toBe(true);
  });
});
