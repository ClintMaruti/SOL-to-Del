import { ApiError, QueryClient, QueryClientProvider } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDocumentTemplates } from "@/entities/document-template";
import type { DocumentTemplateListItem } from "@/entities/document-template";

import { DocumentTemplatesList } from "../ui/DocumentTemplatesList";

vi.mock("@/entities/document-template", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/document-template")>();
  return {
    ...actual,
    useDocumentTemplates: vi.fn(),
  };
});

const mockUseDocumentTemplates = vi.mocked(useDocumentTemplates);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithRouter(
  ui: ReactNode,
  options?: {
    data?: DocumentTemplateListItem[];
    skipMock?: boolean;
    error?: unknown;
  }
) {
  if (!options?.skipMock) {
    const data = options?.data ?? [];
    const err = options?.error;
    mockUseDocumentTemplates.mockReturnValue({
      data,
      isLoading: false,
      error: err ?? null,
      isError: Boolean(err),
      isPending: false,
      isSuccess: !err,
      status: err ? "error" : "success",
      fetchStatus: "idle",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetching: false,
      isLoadingError: false,
      isPaused: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
    } as unknown as ReturnType<typeof useDocumentTemplates>);
  }

  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DocumentTemplatesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton while loading", () => {
    mockUseDocumentTemplates.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      status: "pending",
      fetchStatus: "fetching",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      isFetched: false,
      isFetchedAfterMount: true,
      isRefetching: false,
      isLoadingError: false,
      isPaused: false,
      isRefetchError: false,
      isStale: true,
      refetch: vi.fn(),
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
    } as unknown as ReturnType<typeof useDocumentTemplates>);

    renderWithRouter(<DocumentTemplatesList />, { skipMock: true });

    expect(screen.getByRole("table")).toBeDefined();
  });

  it("shows error message on API failure", () => {
    renderWithRouter(<DocumentTemplatesList />, {
      error: new ApiError("Server error", 500, "Internal Server Error"),
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/server error/i)).toBeDefined();
  });

  it("renders the templates table when data exists", () => {
    renderWithRouter(<DocumentTemplatesList />, {
      data: [{ id: "tpl-1", title: "Quote", blocks: ["Global"] }],
    });

    expect(screen.getByRole("button", { name: "Quote" })).toBeDefined();
  });

  it("sorts templates by title when the header is clicked", async () => {
    const user = userEvent.setup();
    const titles = ["Voucher", "Adventure", "Quote"];

    renderWithRouter(<DocumentTemplatesList />, {
      data: [
        { id: "tpl-1", title: "Voucher", blocks: [] },
        { id: "tpl-2", title: "Adventure", blocks: [] },
        { id: "tpl-3", title: "Quote", blocks: [] },
      ],
    });

    const getRenderedTitles = () =>
      screen
        .getAllByRole("button")
        .map((button) => button.textContent ?? "")
        .filter((text): text is string => titles.includes(text));

    expect(getRenderedTitles()).toEqual(["Voucher", "Adventure", "Quote"]);

    await user.click(screen.getByRole("button", { name: "Title" }));

    expect(getRenderedTitles()).toEqual(["Adventure", "Quote", "Voucher"]);

    await user.click(screen.getByRole("button", { name: "Title" }));

    expect(getRenderedTitles()).toEqual(["Voucher", "Quote", "Adventure"]);
  });
});
