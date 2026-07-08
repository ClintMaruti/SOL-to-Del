import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DocumentTemplateListItem } from "@/entities/document-template";

import { DocumentTemplatesTable } from "../ui/DocumentTemplatesTable";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

function renderWithRouter(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("DocumentTemplatesTable", () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  it("renders the correct rows", () => {
    const rows: DocumentTemplateListItem[] = [
      { id: "tpl-1", title: "Quote", blocks: ["Global"] },
      { id: "tpl-2", title: "Voucher", blocks: [] },
    ];

    renderWithRouter(<DocumentTemplatesTable documentTemplates={rows} />);

    expect(screen.getByRole("button", { name: "Quote" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Voucher" })).toBeDefined();
  });

  it("navigates via title button", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    renderWithRouter(
      <DocumentTemplatesTable
        documentTemplates={[{ id: "tpl-99", title: "Quote", blocks: [] }]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Quote" }));

    expect(navigate).toHaveBeenCalledWith(
      "/database/destinations/content/templates/tpl-99"
    );
  });

  it("shows badge overflow when more than six blocks are present", () => {
    renderWithRouter(
      <DocumentTemplatesTable
        documentTemplates={[
          {
            id: "tpl-1",
            title: "Quote",
            blocks: [
              "One",
              "Two",
              "Three",
              "Four",
              "Five",
              "Six",
              "Seven",
              "Eight",
            ],
          },
        ]}
      />
    );

    expect(screen.getByText("+2")).toBeDefined();
  });

  it("renders an em dash when a template has no blocks", () => {
    renderWithRouter(
      <DocumentTemplatesTable
        documentTemplates={[{ id: "tpl-1", title: "Quote", blocks: [] }]}
      />
    );

    const cells = screen.getAllByRole("cell");
    const blocksCell = cells.find((cell) => cell.textContent === "—");
    expect(blocksCell).toBeTruthy();
  });

  it("uses the sortable title header", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();

    renderWithRouter(
      <DocumentTemplatesTable
        documentTemplates={[{ id: "tpl-1", title: "Quote", blocks: [] }]}
        sortKey={null}
        sortDirection="asc"
        onSort={onSort}
      />
    );

    await user.click(screen.getByRole("button", { name: "Title" }));

    expect(onSort).toHaveBeenCalledWith("title");
  });
});
