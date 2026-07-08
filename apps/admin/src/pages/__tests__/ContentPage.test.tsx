import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ContentPage } from "../ContentPage";

vi.mock("@/widgets/content-blocks-list", () => ({
  ContentBlocksList: () => <div>content blocks widget</div>,
}));

vi.mock("@/widgets/document-templates-list", () => ({
  DocumentTemplatesList: () => <div>document templates widget</div>,
}));

describe("ContentPage", () => {
  it("shows the create button on the default content blocks tab", () => {
    render(
      <MemoryRouter initialEntries={["/database/destinations/content"]}>
        <Routes>
          <Route
            path="/database/destinations/content"
            element={<ContentPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /create/i })).toBeDefined();
    expect(screen.getByText("content blocks widget")).toBeDefined();
  });

  it("keeps the document templates tab active from the url and hides create", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/database/destinations/content?tab=document-templates",
        ]}
      >
        <Routes>
          <Route
            path="/database/destinations/content"
            element={<ContentPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /create/i })).toBeNull();
    expect(screen.getByText("document templates widget")).toBeDefined();
  });

  it("switches tabs and hides create when document templates is selected", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/database/destinations/content"]}>
        <Routes>
          <Route
            path="/database/destinations/content"
            element={<ContentPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("tab", { name: /document templates/i }));

    expect(screen.queryByRole("button", { name: /create/i })).toBeNull();
    expect(screen.getByText("document templates widget")).toBeDefined();
  });

  it("switches back to content blocks from the url-driven templates tab and shows create", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          "/database/destinations/content?tab=document-templates",
        ]}
      >
        <Routes>
          <Route
            path="/database/destinations/content"
            element={<ContentPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /create/i })).toBeNull();
    expect(screen.getByText("document templates widget")).toBeDefined();

    await user.click(screen.getByRole("tab", { name: /content blocks/i }));

    expect(screen.getByRole("button", { name: /create/i })).toBeDefined();
    expect(screen.getByText("content blocks widget")).toBeDefined();
  });
});
