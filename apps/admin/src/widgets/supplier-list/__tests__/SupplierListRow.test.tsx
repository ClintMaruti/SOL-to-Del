import { Table, TableBody } from "@sol/ui";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type { Supplier } from "@/entities/suppliers/model/types";
import { CopyableCellGroup } from "@/shared/ui";

import { SupplierListRow } from "../ui/SupplierListRow";

const baseSupplier: Supplier = {
  id: "sup-1",
  name: "Acme Supplies",
  code: "ACM-01",
  headOfficeName: "Head Office",
  locationName: "Nairobi",
  email: "contact@acme.test",
  isActive: true,
};

function renderRow(supplier: Supplier) {
  return render(
    <MemoryRouter>
      <CopyableCellGroup>
        <Table>
          <TableBody>
            <SupplierListRow
              isEven={false}
              searchQuery=""
              supplier={supplier}
            />
          </TableBody>
        </Table>
      </CopyableCellGroup>
    </MemoryRouter>
  );
}

describe("SupplierListRow", () => {
  describe("phone column", () => {
    it("does not show a copy control when phone is missing", () => {
      renderRow({ ...baseSupplier, phone: undefined });

      expect(
        screen.getByRole("button", { name: "Copy contact@acme.test" })
      ).toBeDefined();
      expect(
        screen.queryByRole("button", { name: "Copy +254 700 000 000" })
      ).toBeNull();
      expect(screen.getByText("—")).toBeDefined();
    });

    it("does not show a copy control when phone is blank or whitespace", () => {
      renderRow({ ...baseSupplier, phone: "   " });

      expect(screen.queryByRole("button", { name: /Copy \+254/ })).toBeNull();
      expect(screen.getByText("—")).toBeDefined();
    });

    it("does not show a copy control when phone is only a plus prefix (cleared intl input)", () => {
      renderRow({ ...baseSupplier, phone: "+" });

      expect(screen.queryByRole("button", { name: "Copy +" })).toBeNull();
      expect(screen.getByText("—")).toBeDefined();
    });

    it("shows copy control when phone has a value", () => {
      renderRow({ ...baseSupplier, phone: "  +254 700 000 000  " });

      expect(
        screen.getByRole("button", { name: "Copy +254 700 000 000" })
      ).toBeDefined();
    });
  });
});
