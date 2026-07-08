import { QueryClient, QueryClientProvider } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierContentBlockListItem } from "@/entities/supplier-content-block";
import { useSupplierContentBlocks } from "@/entities/supplier-content-block";
import { supplierContentBlockDetailPath } from "@/shared/lib/paths";

import { SupplierContentList } from "../ui/SupplierContentList";

const rows: SupplierContentBlockListItem[] = [
  {
    id: "row-1",
    title: "Terms & Conditions",
    bodyPreview: "<p>Hello</p>",
    version: 1,
  },
];

vi.mock("@/entities/supplier-content-block", () => ({
  useSupplierContentBlocks: vi.fn(),
}));

const mockUseSupplierContentBlocks = vi.mocked(useSupplierContentBlocks);

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("SupplierContentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title as a link to the standalone content edit route", () => {
    mockUseSupplierContentBlocks.mockReturnValue({
      data: rows,
      isLoading: false,
      error: null,
    } as never);

    render(<SupplierContentList supplierId="sup-1" />, { wrapper: Wrapper });

    const link = screen.getByRole("link", { name: "Terms & Conditions" });
    expect(link.getAttribute("href")).toBe(
      supplierContentBlockDetailPath("sup-1", "row-1")
    );
  });

  it("shows destructive alert when list query errors", () => {
    mockUseSupplierContentBlocks.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    } as never);

    render(<SupplierContentList supplierId="sup-1" />, { wrapper: Wrapper });

    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
