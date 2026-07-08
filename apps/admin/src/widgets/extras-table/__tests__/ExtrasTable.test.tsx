import { i18n } from "@sol/i18n";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogExtra } from "@/entities/catalog-extra";

import { ExtrasTable } from "../ui/ExtrasTable";

vi.mock("@/entities/catalog-extra/api/useToggleExtraStatus", () => ({
  useToggleExtraStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/shared/stores/loadingStates", () => ({
  useLoadingStates: () => ({ extrasStatus: {} }),
}));

const rows: CatalogExtra[] = [
  {
    id: "e1",
    title: "Picnic",
    linkedServicesOptions: [
      {
        serviceId: "s1",
        serviceName: "Camp",
        serviceOptionId: null,
        serviceOptionName: null,
      },
    ],
    description: null,
    isActive: false,
  },
];

function renderTable(
  overrides: Partial<ComponentProps<typeof ExtrasTable>> & {
    variant: "supplier" | "service";
  }
) {
  const sortState = overrides.sortState ?? {
    field: null,
    direction: "asc" as const,
  };
  const onSort = overrides.onSort ?? (() => {});

  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ExtrasTable
          variant={overrides.variant}
          extras={overrides.extras ?? rows}
          sortState={sortState}
          onSort={onSort}
          supplierId={overrides.supplierId}
        />
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("ExtrasTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Extras, Description, and Active columns only", () => {
    renderTable({ variant: "supplier", supplierId: "sup-1" });

    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getByRole("columnheader", { name: /Extras/i })).toBeDefined();
    expect(
      screen.getByRole("columnheader", { name: /Description/i })
    ).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Active/i })).toBeDefined();
    expect(
      screen.queryByRole("columnheader", { name: /Linked Services/i })
    ).toBeNull();
  });

  it("renders Extras title link when supplierId is set", () => {
    renderTable({ variant: "supplier", supplierId: "sup-1" });

    const titleLink = screen.getByRole("link", { name: "Picnic" });
    expect(titleLink.getAttribute("href")).toContain("/extras/e1");
    expect(titleLink.getAttribute("href")).toContain("sup-1");
  });

  it("shows em dash for empty description", () => {
    renderTable({ variant: "service", supplierId: "sup-1" });

    expect(screen.getByText("—")).toBeDefined();
  });

  it("adds context=service to extra title link for service variant", () => {
    renderTable({ variant: "service", supplierId: "sup-1" });

    const titleLink = screen.getByRole("link", { name: "Picnic" });
    expect(titleLink.getAttribute("href")).toContain("context=service");
  });
});
