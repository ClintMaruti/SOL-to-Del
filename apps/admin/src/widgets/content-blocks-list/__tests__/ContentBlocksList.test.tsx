import { ApiError, QueryClient, QueryClientProvider } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useContentBlocks } from "@/entities/content-block";
import type { ContentBlockListItem } from "@/entities/content-block/model/types";

import { ContentBlocksList } from "../ui/ContentBlocksList";

vi.mock("@/entities/content-block", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/content-block")>();
  return {
    ...actual,
    useContentBlocks: vi.fn(),
  };
});

const mockUseContentBlocks = vi.mocked(useContentBlocks);

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
    data?: ContentBlockListItem[];
    skipMock?: boolean;
    error?: unknown;
  }
) {
  if (!options?.skipMock) {
    const data = options?.data ?? [];
    const err = options?.error;
    mockUseContentBlocks.mockReturnValue({
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
    } as unknown as ReturnType<typeof useContentBlocks>);
  }

  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const sampleBlock: ContentBlockListItem = {
  id: "1",
  title: "Test",
  body: "<p>x</p>",
  applicableDocumentTypes: ["Quote"],
  version: 1,
};

describe("ContentBlocksList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton while loading", () => {
    mockUseContentBlocks.mockReturnValue({
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
    } as unknown as ReturnType<typeof useContentBlocks>);

    renderWithRouter(<ContentBlocksList />, {
      skipMock: true,
    });

    expect(screen.getByRole("table")).toBeDefined();
  });

  it("shows empty state when list is empty", () => {
    renderWithRouter(<ContentBlocksList />, { data: [] });

    expect(
      screen.getByRole("heading", { name: /no content blocks yet/i })
    ).toBeDefined();
  });

  it("shows error message on API failure", () => {
    renderWithRouter(<ContentBlocksList />, {
      data: undefined,
      error: new ApiError("Server error", 500, "Internal Server Error"),
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/server error/i)).toBeDefined();
  });

  it("renders table when data exists", () => {
    renderWithRouter(<ContentBlocksList />, { data: [sampleBlock] });

    expect(screen.getByRole("button", { name: "Test" })).toBeDefined();
  });
});
