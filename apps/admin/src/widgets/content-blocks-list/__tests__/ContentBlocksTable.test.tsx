import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContentBlockListItem } from "@/entities/content-block/model/types";

import { ContentBlocksTable } from "../ui/ContentBlocksTable";

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

function makeBlock(
  id: string,
  title: string,
  options?: {
    body?: string;
    applicableDocumentTypes?: string[];
  }
): ContentBlockListItem {
  return {
    id,
    title,
    body: options?.body ?? "<p>Hello</p>",
    applicableDocumentTypes: options?.applicableDocumentTypes ?? ["Quote"],
    version: 1,
  };
}

describe("ContentBlocksTable", () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  it("renders the correct number of rows", () => {
    const rows = [makeBlock("1", "First"), makeBlock("2", "Second")];
    renderWithRouter(<ContentBlocksTable contentBlocks={rows} />);

    expect(screen.getByRole("button", { name: "First" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Second" })).toBeDefined();
  });

  it("navigates via title link (button)", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    const rows = [makeBlock("cb-99", "My Block")];
    renderWithRouter(<ContentBlocksTable contentBlocks={rows} />);

    await user.click(screen.getByRole("button", { name: "My Block" }));

    expect(navigate).toHaveBeenCalledWith(
      "/database/destinations/content/blocks/cb-99"
    );
  });

  it("shows +N overflow when more than three applicable document types", () => {
    const rows = [
      makeBlock("1", "Many", {
        applicableDocumentTypes: ["A", "B", "C", "D", "E", "F", "G"],
      }),
    ];
    renderWithRouter(<ContentBlocksTable contentBlocks={rows} />);

    expect(screen.getByText("+4")).toBeDefined();
  });

  it("renders an em dash in the templates column when applicable types are empty", () => {
    const rows = [
      makeBlock("1", "No templates", { applicableDocumentTypes: [] }),
    ];
    renderWithRouter(<ContentBlocksTable contentBlocks={rows} />);

    const cells = screen.getAllByRole("cell");
    const templatesCell = cells.find((cell) => cell.textContent === "—");
    expect(templatesCell).toBeTruthy();
  });

  it("shows plain text in the preview column without HTML tags", () => {
    const rows = [
      makeBlock("1", "Block", {
        body: "<p>Visible <strong>copy</strong></p>",
      }),
    ];
    renderWithRouter(<ContentBlocksTable contentBlocks={rows} />);

    expect(screen.getByText("Visible copy")).toBeDefined();
    expect(screen.queryByText(/<p>/i)).toBeNull();
  });
});
