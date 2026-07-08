import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { UseSupplierNotesTabResult } from "@/features/edit-supplier";

import { SupplierNotesPanel } from "../ui/SupplierNotesPanel";

const baseNotesTab: UseSupplierNotesTabResult = {
  text: "<script>alert(1)</script>",
  setText: vi.fn(),
  isLoading: false,
  isFetched: true,
  loadError: false,
  isDirty: true,
  resetToSaved: vi.fn(),
  handleSave: vi.fn(),
  isPending: false,
  formId: "supplier-notes-form",
};

function renderPanel(overrides: Partial<UseSupplierNotesTabResult> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SupplierNotesPanel
          title="Acme"
          description="Desc"
          subHeader={<span>meta</span>}
          tabs={<div>tabs</div>}
          notesTab={{ ...baseNotesTab, ...overrides }}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SupplierNotesPanel", () => {
  it("uses dir auto on textarea for bidirectional content", () => {
    renderPanel();
    const el = screen.getByRole("textbox");
    expect(el.getAttribute("dir")).toBe("auto");
  });

  it("shows script-like content as plain text in the textarea value", () => {
    renderPanel();
    const el = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(el.value).toBe("<script>alert(1)</script>");
  });

  it("keeps label association when document is RTL", () => {
    const prev = document.documentElement.getAttribute("dir");
    document.documentElement.setAttribute("dir", "rtl");
    try {
      renderPanel({ text: "" });
      expect(screen.getByRole("textbox", { name: /^notes$/i })).toBeDefined();
    } finally {
      if (prev) document.documentElement.setAttribute("dir", prev);
      else document.documentElement.removeAttribute("dir");
    }
  });
});
